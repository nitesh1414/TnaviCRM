const { AsyncLocalStorage } = require('async_hooks');
const context = new AsyncLocalStorage();
const scopedCollections = new Set(['properties','brands','leads','meetings','communications','proposals','leases','documents','tasks','reminders','activityLogs','notifications']);
function directlyOwned(record, user) {
  return ['assignedTo','relationshipManager','responsible','employeeId','createdBy','uploadedBy','userId'].some(key => record[key] && String(record[key]) === String(user.id));
}
function visible(collection, record, rawFind) {
  const user = context.getStore();
  if (!user || ['admin','manager','viewer'].includes(user.role) || !scopedCollections.has(collection)) return true;
  if (user.role !== 'employee') return false;
  if (directlyOwned(record,user)) return true;
  if (collection === 'documents' || collection === 'leases') {
    const property = record.propertyId && rawFind('properties', record.propertyId);
    const brand = record.brandId && rawFind('brands', record.brandId);
    return !!((property && directlyOwned(property,user)) || (brand && directlyOwned(brand,user)));
  }
  return false;
}
module.exports = { context, visible };
