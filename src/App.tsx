import React, { useState } from 'react';
import {
  Database,
  Table,
  Key,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  Layers,
  ArrowRight,
  Ticket,
  PartyPopper,
  UtensilsCrossed,
  FileCode2,
} from 'lucide-react';

interface SchemaTable {
  name: string;
  category: 'Tickets' | 'Festas' | 'Cardápio' | 'Admin & Stripe';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: {
    name: string;
    type: string;
    pk?: boolean;
    fk?: string;
    unique?: boolean;
    indexed?: boolean;
    note?: string;
  }[];
}

const TABLES: SchemaTable[] = [
  {
    name: 'ticket_packages',
    category: 'Tickets',
    description: 'Catálogo de pacotes de ingressos disponíveis no parque.',
    icon: Ticket,
    fields: [
      { name: 'id', type: 'uuid', pk: true, note: 'gen_random_uuid()' },
      { name: 'name', type: 'text', note: 'Ex: Day Pass, Passaporte VIP' },
      { name: 'description', type: 'text' },
      { name: 'price_cents', type: 'integer', note: 'Preço em centavos de dólar USD (ex: 9900 = $99.00)' },
      { name: 'stripe_price_id', type: 'text (nullable)', note: 'ID do Price no catálogo Stripe' },
      { name: 'active', type: 'boolean', indexed: true, note: 'Default: true' },
      { name: 'display_order', type: 'integer', indexed: true, note: 'Default: 0' },
      { name: 'created_at / updated_at', type: 'timestamptz', note: 'NOW() com auto-trigger' },
    ],
  },
  {
    name: 'tickets',
    category: 'Tickets',
    description: 'Ingressos individuais emitidos após confirmação do Stripe webhook.',
    icon: Ticket,
    fields: [
      { name: 'id', type: 'uuid', pk: true, note: 'gen_random_uuid()' },
      { name: 'package_id', type: 'uuid', fk: 'ticket_packages.id', note: 'ON DELETE RESTRICT' },
      { name: 'holder_name', type: 'text' },
      { name: 'holder_email', type: 'text', indexed: true, note: 'Busca rápida no check-in' },
      { name: 'holder_phone', type: 'text', indexed: true, note: 'Busca rápida no check-in' },
      { name: 'event_date', type: 'date', indexed: true, note: 'Data do evento (YYYY-MM-DD)' },
      { name: 'event_time', type: 'time (nullable)' },
      { name: 'price_cents', type: 'integer (nullable)', note: 'Preço congelado no momento da venda' },
      { name: 'status', type: "enum ('pending', 'paid', 'used', 'canceled')", indexed: true, note: 'Default: pending' },
      { name: 'stripe_checkout_session_id', type: 'text', unique: true, note: 'Chave única de checkout Stripe' },
      { name: 'stripe_payment_intent_id', type: 'text (nullable)' },
      { name: 'used_at', type: 'timestamptz (nullable)', note: 'Registrado na catraca/staff' },
      { name: 'created_at / updated_at', type: 'timestamptz', note: 'NOW() com auto-trigger' },
    ],
  },
  {
    name: 'party_packages',
    category: 'Festas',
    description: 'Pacotes e combos para aniversários e comemorações no parque.',
    icon: PartyPopper,
    fields: [
      { name: 'id', type: 'uuid', pk: true, note: 'gen_random_uuid()' },
      { name: 'name', type: 'text', note: 'Ex: Combo Aventura Kids' },
      { name: 'description', type: 'text' },
      { name: 'price_cents', type: 'integer', note: 'Valor total em centavos' },
      { name: 'image_url', type: 'text (nullable)' },
      { name: 'active', type: 'boolean', indexed: true, note: 'Default: true' },
      { name: 'display_order', type: 'integer', indexed: true, note: 'Default: 0' },
      { name: 'created_at / updated_at', type: 'timestamptz', note: 'NOW() com auto-trigger' },
    ],
  },
  {
    name: 'party_bookings',
    category: 'Festas',
    description: 'Agendamentos e reservas de festas confirmadas via webhook.',
    icon: PartyPopper,
    fields: [
      { name: 'id', type: 'uuid', pk: true, note: 'gen_random_uuid()' },
      { name: 'package_id', type: 'uuid', fk: 'party_packages.id', note: 'ON DELETE RESTRICT' },
      { name: 'holder_name', type: 'text' },
      { name: 'holder_email', type: 'text', indexed: true },
      { name: 'holder_phone', type: 'text', indexed: true },
      { name: 'event_date', type: 'date', indexed: true },
      { name: 'guest_count', type: 'integer (nullable)' },
      { name: 'price_cents', type: 'integer (nullable)', note: 'Preço congelado no pedido' },
      { name: 'status', type: "enum ('pending', 'paid', 'confirmed', 'canceled')", indexed: true, note: 'Default: pending' },
      { name: 'stripe_checkout_session_id', type: 'text (nullable)', unique: true },
      { name: 'stripe_payment_intent_id', type: 'text (nullable)' },
      { name: 'notes', type: 'text (nullable)' },
      { name: 'created_at / updated_at', type: 'timestamptz', note: 'NOW() com auto-trigger' },
    ],
  },
  {
    name: 'menu_categories',
    category: 'Cardápio',
    description: 'Categorias de alimentos e bebidas das lanchonetes do parque.',
    icon: UtensilsCrossed,
    fields: [
      { name: 'id', type: 'uuid', pk: true, note: 'gen_random_uuid()' },
      { name: 'name', type: 'text', note: 'Ex: Lanches, Bebidas, Sobremesas' },
      { name: 'display_order', type: 'integer', indexed: true, note: 'Default: 0' },
      { name: 'active', type: 'boolean', indexed: true, note: 'Default: true' },
      { name: 'created_at / updated_at', type: 'timestamptz', note: 'NOW() com auto-trigger' },
    ],
  },
  {
    name: 'menu_items',
    category: 'Cardápio',
    description: 'Itens individuais do cardápio com preços e promoções.',
    icon: UtensilsCrossed,
    fields: [
      { name: 'id', type: 'uuid', pk: true, note: 'gen_random_uuid()' },
      { name: 'category_id', type: 'uuid', fk: 'menu_categories.id', note: 'ON DELETE CASCADE' },
      { name: 'name', type: 'text' },
      { name: 'description', type: 'text (nullable)' },
      { name: 'price_cents', type: 'integer', note: 'Preço normal em centavos' },
      { name: 'promo_price_cents', type: 'integer (nullable)', note: 'Preço promocional se ativo' },
      { name: 'image_url', type: 'text (nullable)' },
      { name: 'display_order', type: 'integer', indexed: true, note: 'Default: 0' },
      { name: 'available', type: 'boolean', indexed: true, note: 'Default: true' },
      { name: 'created_at / updated_at', type: 'timestamptz', note: 'NOW() com auto-trigger' },
    ],
  },
  {
    name: 'admin_users',
    category: 'Admin & Stripe',
    description: 'Controle de acesso para administradores e equipe de validação de ingressos.',
    icon: Lock,
    fields: [
      { name: 'id', type: 'uuid', pk: true, note: 'gen_random_uuid()' },
      { name: 'email', type: 'text', unique: true, indexed: true },
      { name: 'password_hash', type: 'text', note: 'Bcrypt hash protegido' },
      { name: 'role', type: "enum ('admin', 'staff')", note: 'staff: apenas check-in; admin: gestão total' },
      { name: 'created_at / updated_at', type: 'timestamptz', note: 'NOW() com auto-trigger' },
    ],
  },
  {
    name: 'stripe_webhook_events',
    category: 'Admin & Stripe',
    description: 'Tabela de idempotência que previne processamento duplicado de eventos do Stripe.',
    icon: ShieldCheck,
    fields: [
      { name: 'id', type: 'uuid', pk: true, note: 'gen_random_uuid()' },
      { name: 'stripe_event_id', type: 'text', unique: true, indexed: true, note: 'ID único do evento Stripe (evt_...)' },
      { name: 'event_type', type: 'text', indexed: true, note: 'Ex: checkout.session.completed' },
      { name: 'payload', type: 'jsonb', note: 'Payload completo para auditoria e debug' },
      { name: 'processed_at', type: 'timestamptz', note: 'Timestamp de quando o evento foi concluído' },
      { name: 'created_at / updated_at', type: 'timestamptz', note: 'NOW() com auto-trigger' },
    ],
  },
];

const BUSINESS_RULES = [
  {
    id: 1,
    title: 'Autoridade Estrita de Pagamento',
    rule: 'Nunca marcar status como "paid" pelo frontend. Apenas o webhook validado da Stripe pode alterar para "paid".',
    verified: true,
  },
  {
    id: 2,
    title: 'Roteamento via Stripe Metadata',
    rule: 'Toda Checkout Session carrega { orderType: "ticket" | "party", packageId: "..." } no metadata.',
    verified: true,
  },
  {
    id: 3,
    title: 'Garantia de Idempotência',
    rule: 'Antes de processar qualquer evento, o webhook consulta stripe_webhook_events(stripe_event_id). Se já existir, ignora.',
    verified: true,
  },
  {
    id: 4,
    title: 'Busca Flexível para Staff (ILIKE)',
    rule: 'Check-in e consultas administrativas suportam busca parcial por Nome, E-mail ou Telefone com índices dedicados.',
    verified: true,
  },
  {
    id: 5,
    title: 'Congelamento de Preços em Centavos',
    rule: 'Preços são gravados em centavos (integer) no ato da compra para garantir que alterações futuras no catálogo não afetem pedidos passados.',
    verified: true,
  },
];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tables' | 'rules' | 'code'>('tables');

  const filteredTables =
    selectedCategory === 'all'
      ? TABLES
      : TABLES.filter((t) => t.category === selectedCategory);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans antialiased">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-neutral-100 tracking-tight">
                  Parque de Diversões
                </h1>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Schema v1.0 Validado
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Esquema relacional PostgreSQL + Drizzle ORM + Migrations
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
            <button
              id="tab-tables-btn"
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'tables'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Tabelas ({TABLES.length})
            </button>
            <button
              id="tab-rules-btn"
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'rules'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Regras de Negócio ({BUSINESS_RULES.length})
            </button>
            <button
              id="tab-code-btn"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'code'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Arquivos Gerados
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Top Status Banner */}
        <div className="mb-8 p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-neutral-200">
                Fase 1 Concluída: Modelagem de Dados e Migrações
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                8 tabelas estruturadas com chaves UUID, constraints de integridade, índices de busca rápida e tabela de idempotência para o Stripe Webhook.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-950 px-3 py-2 rounded-lg border border-neutral-800/80 whitespace-nowrap">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Próximo Passo:</span>
            <span className="text-neutral-200 font-medium">Stripe Webhook & Checkout</span>
          </div>
        </div>

        {/* Tab 1: Tables */}
        {activeTab === 'tables' && (
          <div>
            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <button
                id="filter-all-btn"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-neutral-100 text-neutral-950 font-semibold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                Todas as Tabelas ({TABLES.length})
              </button>
              {['Tickets', 'Festas', 'Cardápio', 'Admin & Stripe'].map((cat) => (
                <button
                  key={cat}
                  id={`filter-${cat.toLowerCase()}-btn`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    selectedCategory === cat
                      ? 'bg-neutral-100 text-neutral-950 font-semibold'
                      : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTables.map((table) => {
                const IconComponent = table.icon;
                return (
                  <div
                    key={table.name}
                    id={`table-card-${table.name}`}
                    className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col"
                  >
                    <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/80 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-neutral-800 text-neutral-300">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-neutral-100">
                              {table.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-medium">
                              {table.category}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {table.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {table.fields.length} campos
                      </span>
                    </div>

                    <div className="p-4 flex-1 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-neutral-500 border-b border-neutral-800 pb-2">
                            <th className="pb-2 font-medium">Campo</th>
                            <th className="pb-2 font-medium">Tipo</th>
                            <th className="pb-2 font-medium">Atributos / Notas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                          {table.fields.map((field) => (
                            <tr key={field.name} className="hover:bg-neutral-800/30">
                              <td className="py-2.5 pr-3 font-mono text-neutral-200 flex items-center gap-1.5">
                                {field.pk && (
                                  <Key className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                )}
                                {field.name}
                              </td>
                              <td className="py-2.5 pr-3 font-mono text-neutral-400">
                                {field.type}
                              </td>
                              <td className="py-2.5 text-neutral-400">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {field.pk && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      PK
                                    </span>
                                  )}
                                  {field.fk && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                      FK → {field.fk}
                                    </span>
                                  )}
                                  {field.unique && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                      UNIQUE
                                    </span>
                                  )}
                                  {field.indexed && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-300">
                                      INDEX
                                    </span>
                                  )}
                                  {field.note && (
                                    <span className="text-neutral-500 text-[11px]">
                                      {field.note}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Business Rules */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-neutral-200">
                Regras de Negócio e Segurança Integradas
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Todas as regras solicitadas foram formalizadas nas definições de schema, types e no DDL de migração.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {BUSINESS_RULES.map((rule) => (
                <div
                  key={rule.id}
                  id={`rule-card-${rule.id}`}
                  className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-start gap-4"
                >
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold flex-shrink-0">
                    {rule.id}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-neutral-200">
                        {rule.title}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                        Ativa
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      {rule.rule}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Code & Artifacts */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-neutral-200">
                Estrutura de Arquivos Gerados
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                A base do backend está pronta e compatível com Drizzle ORM, Node.js e PostgreSQL.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-2 text-neutral-200 text-sm font-medium mb-2">
                  <FileCode2 className="w-4 h-4 text-blue-400" />
                  <span className="font-mono text-xs">src/db/schema.ts</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Definições TypeScript de tabelas, enums, relações e tipos inferidos pelo Drizzle ORM.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-2 text-neutral-200 text-sm font-medium mb-2">
                  <FileCode2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs">drizzle/0000_initial_schema.sql</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Script de migração SQL nativo PostgreSQL com extensões, tipos enums, tabelas, índices e triggers de updated_at.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-2 text-neutral-200 text-sm font-medium mb-2">
                  <FileCode2 className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-xs">src/types/database.ts</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Contratos de interfaces TypeScript, tipos de status e contrato de metadados da sessão Stripe.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-2 text-neutral-200 text-sm font-medium mb-2">
                  <FileCode2 className="w-4 h-4 text-purple-400" />
                  <span className="font-mono text-xs">drizzle.config.ts</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Configuração do Drizzle Kit para execução e gerenciamento de migrações.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
