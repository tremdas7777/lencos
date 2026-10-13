// Mesmas regras do checkout (js/checkout.js). O navegador pode ser burlado;
// aqui é a conferência que vale.
const digitos = (v) => String(v ?? '').replace(/\D/g, '');

export function cpfValido(v) {
  const c = digitos(v);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
}

const DDDS = new Set(('11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 ' +
  '51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99').split(' '));
const UFS = new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));

// Devolve a primeira mensagem de erro, ou '' se o cliente estiver certo.
export function erroCliente(c) {
  if (c.nome.split(/\s+/).filter(Boolean).length < 2) return 'Digite seu nome e sobrenome.';
  if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(c.email)) return 'Confira o e-mail.';
  const tel = digitos(c.telefone);
  if (tel.length !== 11 || !DDDS.has(tel.slice(0, 2)) || tel[2] !== '9') return 'Confira o WhatsApp com DDD.';
  if (!cpfValido(c.cpf)) return 'CPF inválido. Confira os números.';
  if (digitos(c.cep).length !== 8) return 'Confira o CEP.';
  if (!c.endereco || !c.numero || !c.bairro || !c.cidade) return 'Confira o endereço de entrega.';
  if (!UFS.has(c.uf.toUpperCase())) return 'Confira a UF.';
  return '';
}
