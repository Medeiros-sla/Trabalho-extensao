# 🐾 Sistema de Gestão de Vendas e Estoque

## 📋 Sobre o Projeto

O **VendasPro** é um sistema de gestão desenvolvido para auxiliar pequenas lojas de produtos para animais no controle de estoque, cadastro de clientes e registro de vendas.

O projeto foi desenvolvido como atividade prática da disciplina de **Programação para Dispositivos Móveis**, utilizando tecnologias modernas de desenvolvimento web e serviços em nuvem.

A aplicação foi criada com foco em pequenos empreendedores que necessitam de uma solução simples, organizada e acessível para gerenciamento de suas operações diárias.

---

## 🎯 Objetivo

Desenvolver uma solução digital capaz de:

* Controlar o estoque de produtos;
* Registrar vendas;
* Gerenciar clientes;
* Controlar permissões de acesso entre usuários;
* Automatizar a atualização do estoque após cada venda;
* Centralizar informações da empresa em um ambiente seguro.

---

## 🚀 Funcionalidades

### 👤 Autenticação de Usuários

* Login com e-mail e senha;
* Cadastro de novos usuários;
* Recuperação de senha;
* Alteração de nome de exibição;
* Controle de acesso por perfil.

### 🔐 Controle de Permissões

#### Administrador

* Gerenciar usuários;
* Cadastrar produtos;
* Editar produtos;
* Excluir produtos;
* Visualizar relatórios;
* Realizar vendas.

#### Vendedor

* Realizar vendas;
* Cadastrar clientes;
* Editar clientes;
* Consultar produtos;
* Gerenciar informações pessoais;
* Alterar tema da aplicação.

---

### 📦 Gestão de Produtos

* Cadastro de produtos;
* Controle de estoque;
* Controle de quantidade disponível;
* Consulta rápida de produtos;
* Atualização automática do estoque após vendas.

---

### 👥 Gestão de Clientes

* Cadastro de clientes;
* Informações de contato;
* Histórico de relacionamento;
* Consulta rápida.

---

### 💰 Gestão de Vendas

* Registro de vendas;
* Seleção de múltiplos produtos;
* Aplicação de descontos;
* Atualização automática do estoque;
* Histórico de vendas.

---

### ⚙️ Configurações

* Alteração do nome de usuário;
* Troca de tema (Claro / Escuro);
* Redefinição de senha;
* Gerenciamento do perfil.

---

## 🛠️ Tecnologias Utilizadas

### Front-end

* React
* TypeScript
* Tailwind CSS
* Vite

### Backend e Banco de Dados

* Firebase Authentication
* Firebase Firestore
* Firebase Security Rules

### Controle de Versão

* Git
* GitHub

### Hospedagem

* Vercel

---

## 🏗️ Estrutura do Projeto

```bash
src/
├── components/
├── contexts/
├── hooks/
├── lib/
├── pages/
├── services/
├── types/
└── utils/
```

---

## 🔒 Segurança

O sistema utiliza regras de segurança do Firebase Firestore para garantir acesso controlado aos dados.

### Perfis de acesso

| Permissão                    | Administrador | Vendedor |
| ---------------------------- | ------------- | -------- |
| Visualizar produtos          | ✅             | ✅        |
| Cadastrar produtos           | ✅             | ❌        |
| Editar produtos              | ✅             | ❌        |
| Excluir produtos             | ✅             | ❌        |
| Realizar vendas              | ✅             | ✅        |
| Atualizar estoque pela venda | ✅             | ✅        |
| Cadastrar clientes           | ✅             | ✅        |
| Gerenciar usuários           | ✅             | ❌        |

---

## 📱 Responsividade

A aplicação foi desenvolvida para funcionar em:

* Computadores;
* Tablets;
* Smartphones;
* Navegadores modernos.

---


## 🎓 Projeto Acadêmico

Projeto desenvolvido como atividade acadêmica da disciplina de Programação para Dispositivos Móveis.

O sistema foi criado com base em uma necessidade real identificada em uma pequena loja de produtos para animais, buscando aplicar conceitos de desenvolvimento de software, banco de dados em nuvem, autenticação de usuários e controle de estoque.

---

## 👨‍💻 Autor

Desenvolvido por **[Miguel Medeiros da Silva de Moura]**

GitHub: [https://github.com/Medeiros-sla]

Ano: 2026
