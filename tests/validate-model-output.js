import Ajv from 'ajv';
import { readFileSync } from 'fs';

// Load schema
const schema = JSON.parse(
  readFileSync('./tests/schema/saas-founder-output.schema.json', 'utf8')
);

// Load model output
let modelOutput;
try {
  modelOutput = JSON.parse(
    readFileSync('./tests/model-output.json', 'utf8')
  );
} catch (error) {
  console.error('❌ Failed to read or parse model output file:', error.message);
  process.exit(1);
}

// Load sample input for ARR validation
let sampleInput;
try {
  sampleInput = JSON.parse(
    readFileSync('./tests/schema/saas-founder-sample-input.json', 'utf8')
  );
} catch (error) {
  console.error('❌ Failed to read or parse sample input file:', error.message);
  process.exit(1);
}

// Validate schema
const ajv = new Ajv({ strict: true, allErrors: true });
const validate = ajv.compile(schema);
const valid = validate(modelOutput);

if (!valid) {
  console.error('❌ Schema validation failed:');
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

console.log('✅ Schema validation passed');

// Validate ARR calculation
const expectedARR12 = sampleInput.arr * (1 + sampleInput.growth_rate);
const actualARR12 = modelOutput.financial_model.arr_12m;
const tolerance = 1;

if (Math.abs(actualARR12 - expectedARR12) > tolerance) {
  console.error('❌ ARR calculation mismatch:');
  console.error(`  Expected: ${expectedARR12} (±${tolerance})`);
  console.error(`  Actual: ${actualARR12}`);
  console.error(`  Difference: ${Math.abs(actualARR12 - expectedARR12)}`);
  process.exit(1);
}

console.log('✅ ARR calculation validated');
console.log('✅ All validations passed successfully');
console.log('─────────────────────────────────────');
console.log(`Expected ARR_12M: ${expectedARR12}`);
console.log(`Actual ARR_12M: ${actualARR12}`);
const matrixRows = modelOutput.sensitivity_grid.matrix.length;
const matrixCols = matrixRows > 0 ? modelOutput.sensitivity_grid.matrix[0].length : 0;
console.log(`Sensitivity Grid: ${matrixRows}x${matrixCols}`);
console.log('─────────────────────────────────────');
