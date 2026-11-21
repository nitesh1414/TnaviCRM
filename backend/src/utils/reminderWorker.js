const db = require('./db');
const delivery = require('./delivery');
let running = false;
async function runDueReminders(now = new Date(), sender = delivery) {
  if (running) return;
  running = true;
  try {
    const due = db.all('reminders').filter(r => r.status === 'Queued' && Date.parse(r.sendAt) <= now.getTime());
    for (const reminder of due) {
      if (db.find('reminders', reminder.id)?.status !== 'Queued') continue;
      if (reminder.meetingId) {
        const meeting = db.find('meetings', reminder.meetingId);
        if (!meeting || meeting.status !== 'Scheduled' || (meeting.date && meeting.date < now.toISOString().slice(0,10)) || (reminder.meetingSnapshot && ['date','time','venue','title'].some(key => (meeting[key] || '') !== reminder.meetingSnapshot[key]))) {
          db.update('reminders', reminder.id, { status: 'Cancelled', error: 'Meeting changed, is no longer scheduled, or has already passed.' });
          continue;
        }
      }
      // Persist before attempting delivery. An interrupted attempt is never retried automatically,
      // because the provider may have accepted it even if our process did not receive a response.
      if (!db.update('reminders', reminder.id, { status: 'Sending', attemptedAt: new Date().toISOString() }, 'Queued')) continue;
      try {
        const result = reminder.channel === 'email'
          ? await sender.sendEmail({ to: reminder.to, subject: reminder.subject, body: reminder.body })
          : await sender.sendWhatsApp({ to: reminder.to, mode: 'template', templateName: reminder.templateName, language: reminder.language, parameters: reminder.parameters });
        const providerMessageId = reminder.channel === 'email' ? result.messageId : result.messages?.[0]?.id;
        db.update('reminders', reminder.id, { status: 'Accepted', providerMessageId, completedAt: new Date().toISOString() });
        try {
          db.insert('communications', { type: reminder.channel === 'email' ? 'Email' : 'WhatsApp', brandId: reminder.brandId, propertyId: reminder.propertyId, meetingId: reminder.meetingId, employeeId: reminder.createdBy, date: new Date().toISOString().slice(0,10), notes: reminder.channel === 'email' ? reminder.body : `Template: ${reminder.templateName}\n${reminder.parameters.join('\n')}`, recipient: reminder.to, subject: reminder.subject, providerMessageId, reminderId: reminder.id });
        } catch (err) { console.error('Reminder accepted but history could not be saved:', err.message); }
      } catch (err) {
        console.error('Reminder delivery attempt failed:', err.code || err.message);
        db.update('reminders', reminder.id, { status: 'Needs review', completedAt: new Date().toISOString(), error: 'Delivery attempt failed or outcome is unknown. Check provider before rescheduling.' });
      }
    }
  } finally { running = false; }
}
function startReminderWorker() {
  // Recover interrupted attempts conservatively, without risking duplicates.
  for (const r of db.all('reminders').filter(r => r.status === 'Sending')) db.update('reminders', r.id, { status: 'Needs review', error: 'Server restarted during delivery. Check provider before rescheduling.' });
  runDueReminders().catch(err => console.error('Reminder worker error:', err.message));
  const timer = setInterval(() => runDueReminders().catch(err => console.error('Reminder worker error:', err.message)), 60000);
  timer.unref();
  return timer;
}
module.exports = { runDueReminders, startReminderWorker };
