/// <reference types="cypress" />

import { expect as chaiExpect } from 'chai';

describe('BigTech E2E - homologação', () => {
  it('executa BVS Básica PF para CPF 09469124677 usando homologação', () => {
    const payload = {
      input: {
        cpfCnpj: '09469124677',
        serviceCode: '1539-bvs-basica-pf'
      },
      config: {
        useHomologation: true
      }
    };

    // Tenta através do backend de desenvolvimento (esperado: backend em http://localhost:8080)
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/plugins/bigtech/execute',
      body: payload,
      failOnStatusCode: false,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLWJpZ3RlY2giLCJpZGVudGlmaWVyIjoidXNlckBiaWd0ZWNoLmNvbSIsInR5cGUiOiJ1c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NjY3OTM0NzcsImV4cCI6MTc2Njg3OTg3N30.LBrdXO0kPYC5K5UnxjAJhMD73S5Ws4srjKt2lpHrQYY'
      }
    }).then((resp: Cypress.Response<any>) => {
      // Registrar para debug
      cy.log('response status: ' + resp.status);
      cy.log(JSON.stringify(resp.body));

      // Falhas explícitas para ajudar debug (401/403 mostram problema de autenticação/autorização)
      if (resp.status === 401) {
        throw new Error('Unauthorized (401) - verifique SKIP_AUTH ou token de autenticação');
      }
      if (resp.status === 403) {
        throw new Error('Forbidden (403) - verifique se o plugin está ativo e se a configuração foi carregada');
      }

      // Assert básico de sucesso do fluxo (usar chaiExpect para evitar conflitos de tipagem)
      chaiExpect(resp.status).to.be.oneOf([200, 201]);
      chaiExpect(resp.body).to.have.property('success', true);
      chaiExpect(resp.body).to.have.property('data');
    });
  });
});
