// Guarda os pedidos num JSON em data/ (fora da web e do git).
// Basta para começar; troque por um banco quando o volume crescer.
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ } from './config.js';

const ARQUIVO = path.join(RAIZ, 'data', 'pedidos.json');

function ler() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'));
  } catch {
    return {};
  }
}

function gravar(todos) {
  fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
  const tmp = ARQUIVO + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(todos, null, 2));
  fs.renameSync(tmp, ARQUIVO);
}

export function salvarPedido(pedido) {
  const todos = ler();
  todos[pedido.id] = pedido;
  gravar(todos);
  return pedido;
}

export function buscarPedido(id) {
  return ler()[id] || null;
}
