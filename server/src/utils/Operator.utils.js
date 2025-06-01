async function mapDbTypeToJsType(dbType) {
  if (['integer', 'int', 'smallint', 'bigint', 'decimal', 'numeric', 'real', 'double precision'].includes(dbType)) {
    return 'number';
  }
  if (['varchar', 'text', 'char', 'uuid'].includes(dbType)) {
    return 'string';
  }
  if (['boolean'].includes(dbType)) {
    return 'boolean';
  }
  if (['date', 'timestamp', 'datetime'].includes(dbType)) {
    return 'string'; // usually sent as ISO string
  }
  return 'string'; // fallback
}


const operatorMap = {
  'equals': '=',
  'not equals': '!=',
  'greater than': '>',
  'less than': '<',
  'between': 'BETWEEN',
  'contains': 'ILIKE' // Use 'LIKE' if not using PostgreSQL or want case-sensitive
};

function getOperatorSymbol(operator) {
  return operatorMap[operator] || null;
}

function isValidOperator(operator) {
  return Object.keys(operatorMap).includes(operator);
}

function getJsTypeFromDbType(dbType) {
  return mapDbTypeToJsType(dbType);
}

module.exports = {
  mapDbTypeToJsType,
  operatorMap,
  getOperatorSymbol,
  isValidOperator,
  getJsTypeFromDbType
};