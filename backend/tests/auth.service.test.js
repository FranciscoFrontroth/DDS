const authService = require('../src/services/auth.service');

describe('auth.service login', () => {
  it('debe autenticar al administrador y conservar su rol', () => {
    const resultado = authService.login('admin@dds.com', 'admin123');

    expect(resultado).toHaveProperty('token');
    expect(resultado.usuario).toEqual(
      expect.objectContaining({
        id: 'usr-admin',
        rol: 'admin',
      })
    );
  });
});
