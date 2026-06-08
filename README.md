# 🐾 VendasPro - Sistema de Gestão de Vendas e Estoque

Sistema desenvolvido para auxiliar pequenas lojas e comércios locais no controle de estoque, cadastro de clientes e gerenciamento de vendas.

O projeto foi criado como atividade prática da disciplina de **Programação para Dispositivos Móveis**, utilizando tecnologias modernas de desenvolvimento web, banco de dados em nuvem e autenticação segura de usuários.

---

## 🚀 Funcionalidades

### 🔐 Autenticação

* Login com e-mail e senha
* Cadastro de novos usuários
* Recuperação de senha
* Controle de acesso por perfil

### 👤 Perfis de Usuário

#### Administrador

* Gerenciar produtos
* Cadastrar, editar e remover produtos
* Gerenciar usuários
* Visualizar relatórios
* Realizar vendas

#### Vendedor

* Realizar vendas
* Cadastrar clientes
* Consultar produtos
* Alterar informações da própria conta

---

### 📦 Gestão de Produtos

* Cadastro de produtos
* Controle de estoque
* Atualização automática após vendas
* Consulta rápida de produtos

### 👥 Gestão de Clientes

* Cadastro de clientes
* Informações de contato
* Histórico de relacionamento

### 💰 Gestão de Vendas

* Registro de vendas
* Controle de itens vendidos
* Atualização automática do estoque
* Relatórios de vendas
* Exportação de relatórios em PDF

### ⚙️ Configurações

* Alteração de nome de usuário
* Alteração de tema (claro/escuro)
* Redefinição de senha

---

## ☁️ Banco de Dados

O projeto utiliza **Firebase** para:

* Autenticação de usuários
* Armazenamento de produtos
* Armazenamento de clientes
* Controle de vendas
* Controle de permissões por perfil

---

## 🛠️ Tecnologias Utilizadas

* React
* TypeScript
* Vite
* Tailwind CSS
* Firebase Authentication
* Firebase Firestore
* Firebase Security Rules
* jsPDF
* GitHub
* Vercel

---

## 🔒 Segurança

O sistema utiliza regras de segurança do Firebase Firestore para garantir que cada usuário tenha acesso apenas às funcionalidades permitidas pelo seu perfil.

Os perfis são divididos em:

* Administrador
* Vendedor

Cada perfil possui permissões específicas para garantir maior segurança e organização dos dados.

---

## 🌐 Demonstração

Aplicação hospedada via Vercel:

https://teste-faculdade2.vercel.app/login

Caso deseje testar o sistema, utilize a funcionalidade de cadastro disponível na tela de login.

---

## ⚙️ Instalação

Clone o repositório:

```bash
git clone https://github.com/Medeiros-sla/Trabalho-extensao.git
```

Instale as dependências:

```bash
npm install
```

Execute o projeto:

```bash
npm run dev
```

---

## 📚 Objetivo do Projeto

O sistema foi desenvolvido para atender às necessidades de uma pequena loja de produtos para animais, a **Pipicos Pet**, proporcionando maior controle sobre vendas, estoque e clientes, reduzindo erros operacionais e melhorando a organização das informações.

---

## 📸 Capturas de Tela

Adicione aqui imagens do sistema:

* Tela de Login
* Dashboard
* Cadastro de Produtos
* Cadastro de Clientes
* Controle de Vendas
* Relatórios

---

## 👨‍💻 Autor

Desenvolvido por **Miguel Medeiros da Silva de Moura**

Projeto acadêmico – Programação para Dispositivos Móveis.
