const { OpenApiParser } = require('./dist/utils/openapiParser.js');

async function testParser() {
  const parser = new OpenApiParser();
  try {
    const result = await parser.parse('./src/plugins/consulta/infosimples/infosimples.yaml');
    console.log('Parsed successfully, services count:', result.length);
    const testService = result.find(s => s.form && s.form.title && s.form.title.includes('Teste'));
    console.log('Test service found:', !!testService);
    if (testService) console.log('Test service title:', testService.form.title);
  } catch (err) {
    console.error('Parse error:', err.message);
    console.error('Stack:', err.stack);
  }
}

testParser();