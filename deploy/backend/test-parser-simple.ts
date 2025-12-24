import { OpenApiParser } from './src/utils/openapiParser';
import * as path from 'path';
import * as yaml from 'js-yaml';

const yamlPath = path.join(__dirname, 'src/plugins/consulta/infosimples/infosimples.yaml');

try {
  const fs = require('fs');
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const spec = yaml.load(yamlContent) as any;

  // Verificar receita-federal/cpf especificamente
  const receitaPath = spec.paths['/consultas/receita-federal/cpf'];
  if (receitaPath) {
    const postSpec = receitaPath[':post'];
    console.log('receita-federal/cpf :post keys:', Object.keys(postSpec));
    console.log('receita-federal/cpf :post parameters exists:', !!postSpec[':parameters']);
    if (postSpec[':parameters']) {
      console.log('receita-federal/cpf :post parameters count:', postSpec[':parameters'].length);
      console.log('First parameter:', JSON.stringify(postSpec[':parameters'][0], null, 2));
    }
  }

  // Verificar cenprot-sp/protestos
  const cenprotPath = spec.paths['/consultas/cenprot-sp/protestos'];
  if (cenprotPath) {
    const postSpec = cenprotPath[':post'];
    console.log('cenprot-sp/protestos :post parameters exists:', !!postSpec[':parameters']);
    if (postSpec[':parameters']) {
      console.log('cenprot-sp/protestos :post parameters count:', postSpec[':parameters'].length);
    }
  }

  // Testar parser
  const parser = new OpenApiParser();
  const schemas = parser.parse(yamlContent);
  console.log(`Loaded ${schemas.length} schemas`);

  // Testar receita_federal_cpf
  const cpfSchema = schemas.find(s => s.id === 'receita-federal_cpf');
  if (cpfSchema) {
    console.log('receita-federal_cpf schema found');
    console.log('Fields:', cpfSchema.form.fields.map(f => f.name));
  } else {
    console.log('receita-federal_cpf not found');
  }

  // Testar cenprot-sp_protestos
  const cenprotSchema = schemas.find(s => s.id === 'cenprot-sp_protestos');
  if (cenprotSchema) {
    console.log('cenprot-sp_protestos schema found');
    console.log('Fields:', cenprotSchema.form.fields.map(f => f.name));
  } else {
    console.log('cenprot-sp_protestos not found');
  }

} catch (error) {
  console.error('Error:', error);
}