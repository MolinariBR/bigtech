import { OpenApiParser } from './src/utils/openapiParser';
import * as path from 'path';
import * as yaml from 'js-yaml';

const yamlPath = path.join(__dirname, 'src/plugins/consulta/infosimples/infosimples.yaml');

try {
  // Teste direto do carregamento YAML
  const fs = require('fs');
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  console.log('YAML content length:', yamlContent.length);

  const spec = yaml.load(yamlContent) as any;
  console.log('Spec keys:', Object.keys(spec));
  console.log('Paths keys count:', Object.keys(spec.paths).length);

  // Verificar métodos disponíveis nos primeiros paths
  const firstPaths = Object.entries(spec.paths).slice(0, 5);
  console.log('First 5 paths and their methods:');
  firstPaths.forEach(([path, methods]: [string, any]) => {
    console.log(`${path}: ${Object.keys(methods).join(', ')}`);
  });

  // Verificar receita-federal/cpf especificamente
  const receitaPath = spec.paths['/consultas/receita-federal/cpf'];
  if (receitaPath) {
    console.log('receita-federal/cpf methods:', Object.keys(receitaPath));
    console.log('receita-federal/cpf parameters:', receitaPath.parameters);
    console.log('receita-federal/cpf :post parameters:', receitaPath[':post']?.parameters);
  } else {
    console.log('receita-federal/cpf path not found');
  }

  // Verificar cenprot-sp/protestos
  const cenprotPath = spec.paths['/consultas/cenprot-sp/protestos'];
  if (cenprotPath) {
    console.log('cenprot-sp/protestos methods:', Object.keys(cenprotPath));
    console.log('cenprot-sp/protestos parameters:', cenprotPath.parameters);
    console.log('cenprot-sp/protestos :post parameters:', cenprotPath[':post']?.parameters);
  } else {
    console.log('cenprot-sp/protestos path not found');
  }

  // Testar parser
  const parser = new OpenApiParser();
  const schemas = parser.parse(yamlContent);
  console.log(`Loaded ${schemas.length} schemas`);

  // Debug: mostrar conteúdo do postSpec para receita-federal/cpf
  const receitaPath = spec.paths['/consultas/receita-federal/cpf'];
  if (receitaPath) {
    const postSpec = receitaPath[':post'];
    console.log('receita-federal/cpf :post keys:', Object.keys(postSpec));
    console.log('receita-federal/cpf :post parameters exists:', !!postSpec[':parameters']);
    if (postSpec[':parameters']) {
      console.log('receita-federal/cpf :post parameters count:', postSpec[':parameters'].length);
      console.log('First parameter:', postSpec[':parameters'][0]);
    }
  }

  // Testar receita_federal_cpf
  const cpfSchema = schemas.find(s => s.id === 'receita-federal_cpf');
  if (cpfSchema) {
    console.log('receita-federal_cpf schema found');
    console.log('Fields:', cpfSchema.form.fields.map(f => f.name));
  } else {
    console.log('receita-federal_cpf not found');
    // Mostrar alguns IDs para debug
    console.log('First 10 schema IDs:', schemas.slice(0, 10).map(s => s.id));
  }

  // Testar cenprot_sp_protestos
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