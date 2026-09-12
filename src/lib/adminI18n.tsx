import React, { createContext, useContext, useState, useEffect } from 'react';

export type AdminLanguage = 'pt' | 'en' | 'es';

export interface AdminLanguageOption {
  code: AdminLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const ADMIN_LANGUAGE_OPTIONS: AdminLanguageOption[] = [
  { code: 'pt', label: 'Português', nativeLabel: 'Português (BR)', flag: '🇧🇷' },
  { code: 'en', label: 'Inglês', nativeLabel: 'English (US)', flag: '🇺🇸' },
  { code: 'es', label: 'Espanhol', nativeLabel: 'Español (ES)', flag: '🇪🇸' },
];

export const ADMIN_MONTH_NAMES: Record<AdminLanguage, string[]> = {
  pt: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  es: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
};

export const ADMIN_WEEK_DAYS: Record<AdminLanguage, string[]> = {
  pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  es: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
};

export const ADMIN_TRANSLATIONS: Record<AdminLanguage, Record<string, string>> = {
  pt: {
    // Header & Dashboard
    'admin.header.title': 'Painel de Controle',
    'admin.header.subtitle': 'Gestão do Parque',
    'admin.header.view_site': 'Ver Site Público',
    'admin.header.site_short': 'Site',
    'admin.header.logout': 'Sair',
    'admin.header.logout_title': 'Encerrar Sessão',
    'admin.header.logout_confirm': 'Tem certeza que deseja sair do painel administrativo?',
    'admin.header.logout_cancel': 'Cancelar',
    'admin.header.logout_action': 'Sair Agora',
    'admin.header.language': 'Idioma do Painel',

    // Tabs
    'admin.tabs.tickets': 'Ingressos',
    'admin.tabs.party_bookings': 'Reservas de Festa',
    'admin.tabs.party_calendar': 'Calendário de Festas',
    'admin.tabs.menu_orders': 'Pedidos do Cardápio',
    'admin.tabs.ticket_packages': 'Pacotes de Ingresso',
    'admin.tabs.party_packages': 'Pacotes de Festa',
    'admin.tabs.menu': 'Cardápio',
    'admin.tabs.site_settings': 'Home & Configurações',

    // Common UI
    'admin.common.search': 'Buscar...',
    'admin.common.refresh': 'Atualizar',
    'admin.common.total': 'Total',
    'admin.common.loading': 'Carregando...',
    'admin.common.save': 'Salvar',
    'admin.common.saving': 'Salvando...',
    'admin.common.cancel': 'Cancelar',
    'admin.common.delete': 'Excluir',
    'admin.common.edit': 'Editar',
    'admin.common.actions': 'Ação',
    'admin.common.status': 'Status',
    'admin.common.date': 'Data',
    'admin.common.time': 'Horário',
    'admin.common.name': 'Nome',
    'admin.common.email': 'E-mail',
    'admin.common.phone': 'Telefone',
    'admin.common.notes': 'Observações',
    'admin.common.close': 'Fechar',
    'admin.common.back': 'Voltar',
    'admin.common.confirm': 'Confirmar',
    'admin.common.active': 'Ativo',
    'admin.common.inactive': 'Inativo',
    'admin.common.yes': 'Sim',
    'admin.common.no': 'Não',
    'admin.common.all': 'Todos',
    'admin.common.filter': 'Filtrar',
    'admin.common.price': 'Preço',
    'admin.common.details': 'Detalhes',
    'admin.common.success': 'Operação realizada com sucesso!',
    'admin.common.error': 'Ocorreu um erro.',

    // Statuses
    'admin.status.pending': 'Pendente',
    'admin.status.paid': 'Pago',
    'admin.status.confirmed': 'Confirmado',
    'admin.status.used': 'Utilizado',
    'admin.status.canceled': 'Cancelado',
    'admin.status.delivered': 'Entregue',
    'admin.status.preparing': 'Preparando',
    'admin.status.ready': 'Pronto',

    // Ingressos (Tickets Tab)
    'admin.tickets.search_placeholder': 'Buscar por nome, e-mail ou telefone...',
    'admin.tickets.col_holder': 'Nome do Titular',
    'admin.tickets.col_email': 'E-mail',
    'admin.tickets.col_phone': 'Telefone',
    'admin.tickets.col_package': 'Pacote',
    'admin.tickets.col_visit_date': 'Data da Visita',
    'admin.tickets.col_status': 'Status',
    'admin.tickets.col_action': 'Ação',
    'admin.tickets.btn_validate': 'Marcar como Utilizado',
    'admin.tickets.validating': 'Validando...',
    'admin.tickets.validated_badge': 'Utilizado',
    'admin.tickets.checkin_done': 'Check-in realizado',
    'admin.tickets.empty_title': 'Nenhum ingresso encontrado',
    'admin.tickets.empty_desc': 'Nenhum ingresso registrado no momento.',
    'admin.tickets.empty_search': 'Nenhum resultado corresponde ao termo "{term}".',
    'admin.tickets.loading': 'Carregando lista de ingressos...',

    // Reservas de Festa (Party Bookings Tab)
    'admin.party_bookings.search_placeholder': 'Buscar por cliente, e-mail ou telefone...',
    'admin.party_bookings.single_count': 'reserva registrada',
    'admin.party_bookings.multiple_count': 'reservas registradas',
    'admin.party_bookings.payment_options': 'Opções de Pagamento',
    'admin.party_bookings.col_responsible': 'Responsável',
    'admin.party_bookings.col_package': 'Pacote',
    'admin.party_bookings.col_date': 'Data do Evento',
    'admin.party_bookings.col_time': 'Horário',
    'admin.party_bookings.col_guests': 'Convidados',
    'admin.party_bookings.col_payment_type': 'Modalidade',
    'admin.party_bookings.col_total': 'Valor Total',
    'admin.party_bookings.col_paid': 'Pago',
    'admin.party_bookings.col_balance': 'Saldo Pendente',
    'admin.party_bookings.btn_settle_balance': 'Liquidar Saldo',
    'admin.party_bookings.settled_badge': 'Quitado',
    'admin.party_bookings.btn_view_notes': 'Ver Observações',
    'admin.party_bookings.btn_payment_settings': 'Formas de Fechamento de Festa',
    'admin.party_bookings.empty_title': 'Nenhuma reserva de festa encontrada',
    'admin.party_bookings.empty_desc': 'Nenhuma reserva de festa registrada até o momento.',
    'admin.party_bookings.loading': 'Carregando lista de reservas...',
    'admin.party_bookings.pay_none': 'Sem Entrada ($0 agora)',
    'admin.party_bookings.pay_deposit': 'Entrada Parcial',
    'admin.party_bookings.pay_full': 'Integral (100%)',

    // Calendário de Festas (Party Calendar Tab)
    'admin.calendar.title': 'Agenda Visual do Salão de Festas',
    'admin.calendar.subtitle': 'Controle de exclusividade e horários livres',
    'admin.calendar.today': 'Hoje',
    'admin.calendar.parties_count': '{count} festa(s)',
    'admin.calendar.select_day_title': 'Festas agendadas para',
    'admin.calendar.no_parties_day': 'Nenhuma festa agendada para esta data.',
    'admin.calendar.time_slot': 'Faixa de Horário',
    'admin.calendar.balance_settle_btn': 'Marcar Saldo como Pago Presencialmente',
    'admin.calendar.exclusivity_rule': 'Regra de Exclusividade: Apenas 1 festa acontece por faixa de horário.',
    'admin.calendar.loading': 'Carregando calendário de festas...',

    // Pedidos do Cardápio (Menu Orders Tab)
    'admin.menu_orders.search_placeholder': 'Buscar por cliente, e-mail, telefone...',
    'admin.menu_orders.filter_all': 'Todos os Pedidos',
    'admin.menu_orders.col_order': 'Pedido',
    'admin.menu_orders.col_customer': 'Cliente',
    'admin.menu_orders.col_items': 'Itens do Pedido',
    'admin.menu_orders.col_amount': 'Valor Total',
    'admin.menu_orders.col_status': 'Status',
    'admin.menu_orders.btn_mark_ready': 'Marcar como Pronto',
    'admin.menu_orders.btn_mark_delivered': 'Marcar como Entregue',
    'admin.menu_orders.empty_title': 'Nenhum pedido de cardápio encontrado',
    'admin.menu_orders.loading': 'Carregando pedidos do cardápio...',

    // Pacotes de Ingresso (Ticket Packages Tab)
    'admin.ticket_packages.title': 'Gerenciar Pacotes de Ingressos',
    'admin.ticket_packages.subtitle': 'Configure os passaportes vendidos no site, valores e destaques na Home.',
    'admin.ticket_packages.btn_new': 'Novo Pacote',
    'admin.ticket_packages.loading': 'Carregando pacotes de ingressos...',
    'admin.ticket_packages.empty_title': 'Nenhum pacote cadastrado',
    'admin.ticket_packages.empty_desc': 'Clique em "Novo Pacote" para adicionar sua primeira opção de ingresso.',
    'admin.ticket_packages.featured_home': 'Destaques Home',
    'admin.ticket_packages.col_photo': 'Foto',
    'admin.ticket_packages.col_name': 'Nome do Pacote',
    'admin.ticket_packages.col_description': 'Descrição',
    'admin.ticket_packages.col_price': 'Preço',
    'admin.ticket_packages.col_order': 'Ordem',
    'admin.ticket_packages.col_status': 'Status',
    'admin.ticket_packages.col_featured': 'Destaque Home',
    'admin.ticket_packages.featured_badge': 'Destacado',
    'admin.ticket_packages.feature_btn': 'Destacar',
    'admin.ticket_packages.modal_new': 'Novo Pacote de Ingresso',
    'admin.ticket_packages.modal_edit': 'Editar Pacote de Ingresso',
    'admin.ticket_packages.field_name': 'Nome do Pacote',
    'admin.ticket_packages.field_description': 'Descrição',
    'admin.ticket_packages.field_photo': 'Foto Ilustrativa do Pacote',
    'admin.ticket_packages.field_price': 'Preço ($ USD)',
    'admin.ticket_packages.field_order': 'Ordem de Exibição',
    'admin.ticket_packages.field_status': 'Status do Pacote',
    'admin.ticket_packages.field_status_active': 'Disponível para compra',
    'admin.ticket_packages.field_status_inactive': 'Oculto na página pública',
    'admin.ticket_packages.field_featured': 'Destacar na Home',
    'admin.ticket_packages.field_featured_desc': 'Exibir este passaporte na vitrine principal da página inicial (máximo de 3).',
    'admin.ticket_packages.save_btn': 'Salvar Alterações',
    'admin.ticket_packages.create_btn': 'Criar Pacote',

    // Pacotes de Festa (Party Packages Tab)
    'admin.party_packages.title': 'Gerenciar Pacotes de Festas',
    'admin.party_packages.subtitle': 'Configure temas, valores, quantidade de convidados e duração das festas',
    'admin.party_packages.btn_new': 'Novo Pacote de Festa',
    'admin.party_packages.duration_label': 'Duração (minutos)',
    'admin.party_packages.loading': 'Carregando pacotes de festa...',
    'admin.party_packages.empty_title': 'Nenhum pacote de festa cadastrado',
    'admin.party_packages.empty_desc': 'Clique em "Novo Pacote de Festa" para cadastrar opções de festas.',
    'admin.party_packages.col_photo': 'Foto',
    'admin.party_packages.col_name': 'Tema / Pacote',
    'admin.party_packages.col_guests': 'Convidados',
    'admin.party_packages.col_duration': 'Duração',
    'admin.party_packages.col_price': 'Preço',
    'admin.party_packages.col_status': 'Status',
    'admin.party_packages.modal_new': 'Novo Pacote de Festa',
    'admin.party_packages.modal_edit': 'Editar Pacote de Festa',
    'admin.party_packages.field_name': 'Nome do Pacote / Tema',
    'admin.party_packages.field_description': 'Descrição e Itens Inclusos',
    'admin.party_packages.field_photo': 'Foto Ilustrativa',
    'admin.party_packages.field_price': 'Preço Total ($ USD)',
    'admin.party_packages.field_guests': 'Número de Convidados',
    'admin.party_packages.field_duration': 'Duração (em minutos)',
    'admin.party_packages.field_status': 'Status do Pacote',

    // Cardápio (Menu Tab)
    'admin.menu_tab.title': 'Gerenciar Cardápio & Gastronomia',
    'admin.menu_tab.subtitle': 'Controle de pratos, porções, bebidas, categorias e banner promocional',
    'admin.menu_tab.btn_new_item': 'Adicionar Item',
    'admin.menu_tab.btn_new_category': 'Nova Categoria',
    'admin.menu_tab.subtab_items': 'Itens do Cardápio',
    'admin.menu_tab.subtab_categories': 'Categorias',
    'admin.menu_tab.subtab_banner': 'Banner Promocional',
    'admin.menu_tab.loading': 'Carregando itens do cardápio...',
    'admin.menu_tab.col_image': 'Imagem',
    'admin.menu_tab.col_name': 'Nome do Prato / Bebida',
    'admin.menu_tab.col_category': 'Categoria',
    'admin.menu_tab.col_price': 'Preço',
    'admin.menu_tab.col_available': 'Disponibilidade',
    'admin.menu_tab.available': 'Disponível',
    'admin.menu_tab.unavailable': 'Indisponível',
    'admin.menu_tab.modal_new_item': 'Novo Item do Cardápio',
    'admin.menu_tab.modal_edit_item': 'Editar Item do Cardápio',
    'admin.menu_tab.modal_new_category': 'Nova Categoria do Cardápio',
    'admin.menu_tab.modal_edit_category': 'Editar Categoria',
    'admin.menu_tab.field_item_name': 'Nome do Item',
    'admin.menu_tab.field_item_desc': 'Descrição dos Ingredientes / Detalhes',
    'admin.menu_tab.field_item_price': 'Preço ($ USD)',
    'admin.menu_tab.field_item_category': 'Categoria',
    'admin.menu_tab.field_item_image': 'Foto do Prato / Bebida',
    'admin.menu_tab.field_item_status': 'Disponível para Pedidos',

    // Configurações do Site (Site Settings Tab)
    'admin.settings.title': 'Home & Configurações Gerais',
    'admin.settings.subtitle': 'Vídeo de fundo, imagens de destaque, horários e contatos do parque',
    'admin.settings.hero_title': 'Vídeo ou Imagem de Destaque (Hero)',
    'admin.settings.hero_video_url': 'URL do Vídeo de Fundo (MP4/WebM)',
    'admin.settings.hero_poster_url': 'Imagem de Pré-carregamento (Poster)',
    'admin.settings.contact_title': 'Informações de Contato e Localização',
    'admin.settings.address': 'Endereço Completo do Parque',
    'admin.settings.phone_primary': 'Telefone Principal',
    'admin.settings.phone_secondary': 'Telefone Secundário (Opcional)',
    'admin.settings.email': 'E-mail de Contato',
    'admin.settings.btn_save': 'Salvar Configurações',
    'admin.settings.saving': 'Salvando alterações...',
    'admin.settings.save_success': 'Configurações salvas com sucesso!',
  },

  en: {
    // Header & Dashboard
    'admin.header.title': 'Control Panel',
    'admin.header.subtitle': 'Park Management',
    'admin.header.view_site': 'View Public Site',
    'admin.header.site_short': 'Site',
    'admin.header.logout': 'Log Out',
    'admin.header.logout_title': 'End Session',
    'admin.header.logout_confirm': 'Are you sure you want to log out of the admin panel?',
    'admin.header.logout_cancel': 'Cancel',
    'admin.header.logout_action': 'Log Out Now',
    'admin.header.language': 'Admin Language',

    // Tabs
    'admin.tabs.tickets': 'Tickets',
    'admin.tabs.party_bookings': 'Party Bookings',
    'admin.tabs.party_calendar': 'Party Calendar',
    'admin.tabs.menu_orders': 'Menu Orders',
    'admin.tabs.ticket_packages': 'Ticket Packages',
    'admin.tabs.party_packages': 'Party Packages',
    'admin.tabs.menu': 'Menu',
    'admin.tabs.site_settings': 'Home & Settings',

    // Common UI
    'admin.common.search': 'Search...',
    'admin.common.refresh': 'Refresh',
    'admin.common.total': 'Total',
    'admin.common.loading': 'Loading...',
    'admin.common.save': 'Save',
    'admin.common.saving': 'Saving...',
    'admin.common.cancel': 'Cancel',
    'admin.common.delete': 'Delete',
    'admin.common.edit': 'Edit',
    'admin.common.actions': 'Action',
    'admin.common.status': 'Status',
    'admin.common.date': 'Date',
    'admin.common.time': 'Time',
    'admin.common.name': 'Name',
    'admin.common.email': 'Email',
    'admin.common.phone': 'Phone',
    'admin.common.notes': 'Notes',
    'admin.common.close': 'Close',
    'admin.common.back': 'Back',
    'admin.common.confirm': 'Confirm',
    'admin.common.active': 'Active',
    'admin.common.inactive': 'Inactive',
    'admin.common.yes': 'Yes',
    'admin.common.no': 'No',
    'admin.common.all': 'All',
    'admin.common.filter': 'Filter',
    'admin.common.price': 'Price',
    'admin.common.details': 'Details',
    'admin.common.success': 'Operation completed successfully!',
    'admin.common.error': 'An error occurred.',

    // Statuses
    'admin.status.pending': 'Pending',
    'admin.status.paid': 'Paid',
    'admin.status.confirmed': 'Confirmed',
    'admin.status.used': 'Used',
    'admin.status.canceled': 'Canceled',
    'admin.status.delivered': 'Delivered',
    'admin.status.preparing': 'Preparing',
    'admin.status.ready': 'Ready',

    // Tickets Tab
    'admin.tickets.search_placeholder': 'Search by name, email or phone...',
    'admin.tickets.col_holder': 'Passholder Name',
    'admin.tickets.col_email': 'Email',
    'admin.tickets.col_phone': 'Phone',
    'admin.tickets.col_package': 'Package',
    'admin.tickets.col_visit_date': 'Visit Date',
    'admin.tickets.col_status': 'Status',
    'admin.tickets.col_action': 'Action',
    'admin.tickets.btn_validate': 'Mark as Used',
    'admin.tickets.validating': 'Validating...',
    'admin.tickets.validated_badge': 'Used',
    'admin.tickets.checkin_done': 'Check-in completed',
    'admin.tickets.empty_title': 'No tickets found',
    'admin.tickets.empty_desc': 'No tickets registered at the moment.',
    'admin.tickets.empty_search': 'No results matching "{term}".',
    'admin.tickets.loading': 'Loading ticket list...',

    // Party Bookings Tab
    'admin.party_bookings.search_placeholder': 'Search by client, email or phone...',
    'admin.party_bookings.single_count': 'booking registered',
    'admin.party_bookings.multiple_count': 'bookings registered',
    'admin.party_bookings.payment_options': 'Payment Options',
    'admin.party_bookings.col_responsible': 'Organizer',
    'admin.party_bookings.col_package': 'Package',
    'admin.party_bookings.col_date': 'Event Date',
    'admin.party_bookings.col_time': 'Time',
    'admin.party_bookings.col_guests': 'Guests',
    'admin.party_bookings.col_payment_type': 'Payment Mode',
    'admin.party_bookings.col_total': 'Total Price',
    'admin.party_bookings.col_paid': 'Paid',
    'admin.party_bookings.col_balance': 'Balance Due',
    'admin.party_bookings.btn_settle_balance': 'Settle Balance',
    'admin.party_bookings.settled_badge': 'Fully Paid',
    'admin.party_bookings.btn_view_notes': 'View Notes',
    'admin.party_bookings.btn_payment_settings': 'Party Payment Methods',
    'admin.party_bookings.empty_title': 'No party bookings found',
    'admin.party_bookings.empty_desc': 'No party bookings registered so far.',
    'admin.party_bookings.loading': 'Loading party bookings...',
    'admin.party_bookings.pay_none': 'No Deposit ($0 now)',
    'admin.party_bookings.pay_deposit': 'Partial Deposit',
    'admin.party_bookings.pay_full': 'Full Payment (100%)',

    // Party Calendar Tab
    'admin.calendar.title': 'Party Room Schedule & Visual Calendar',
    'admin.calendar.subtitle': 'Exclusivity control and available time slots',
    'admin.calendar.today': 'Today',
    'admin.calendar.parties_count': '{count} party/parties',
    'admin.calendar.select_day_title': 'Parties scheduled for',
    'admin.calendar.no_parties_day': 'No parties scheduled for this date.',
    'admin.calendar.time_slot': 'Time Slot',
    'admin.calendar.balance_settle_btn': 'Mark Balance as Paid in Person',
    'admin.calendar.exclusivity_rule': 'Exclusivity Rule: Only 1 party is held per time slot.',
    'admin.calendar.loading': 'Loading party calendar...',

    // Menu Orders Tab
    'admin.menu_orders.search_placeholder': 'Search by customer, email, phone...',
    'admin.menu_orders.filter_all': 'All Orders',
    'admin.menu_orders.col_order': 'Order',
    'admin.menu_orders.col_customer': 'Customer',
    'admin.menu_orders.col_items': 'Order Items',
    'admin.menu_orders.col_amount': 'Total Amount',
    'admin.menu_orders.col_status': 'Status',
    'admin.menu_orders.btn_mark_ready': 'Mark as Ready',
    'admin.menu_orders.btn_mark_delivered': 'Mark as Delivered',
    'admin.menu_orders.empty_title': 'No menu orders found',
    'admin.menu_orders.loading': 'Loading menu orders...',

    // Ticket Packages Tab
    'admin.ticket_packages.title': 'Manage Ticket Packages',
    'admin.ticket_packages.subtitle': 'Configure admission passes sold online, pricing, and home highlights.',
    'admin.ticket_packages.btn_new': 'New Package',
    'admin.ticket_packages.loading': 'Loading ticket packages...',
    'admin.ticket_packages.empty_title': 'No ticket packages found',
    'admin.ticket_packages.empty_desc': 'Click "New Package" to add your first admission option.',
    'admin.ticket_packages.featured_home': 'Home Highlights',
    'admin.ticket_packages.col_photo': 'Photo',
    'admin.ticket_packages.col_name': 'Package Name',
    'admin.ticket_packages.col_description': 'Description',
    'admin.ticket_packages.col_price': 'Price',
    'admin.ticket_packages.col_order': 'Order',
    'admin.ticket_packages.col_status': 'Status',
    'admin.ticket_packages.col_featured': 'Home Highlight',
    'admin.ticket_packages.featured_badge': 'Featured',
    'admin.ticket_packages.feature_btn': 'Feature',
    'admin.ticket_packages.modal_new': 'New Ticket Package',
    'admin.ticket_packages.modal_edit': 'Edit Ticket Package',
    'admin.ticket_packages.field_name': 'Package Name',
    'admin.ticket_packages.field_description': 'Description',
    'admin.ticket_packages.field_photo': 'Illustrative Photo',
    'admin.ticket_packages.field_price': 'Price ($ USD)',
    'admin.ticket_packages.field_order': 'Display Order',
    'admin.ticket_packages.field_status': 'Package Status',
    'admin.ticket_packages.field_status_active': 'Available for purchase',
    'admin.ticket_packages.field_status_inactive': 'Hidden on public website',
    'admin.ticket_packages.field_featured': 'Feature on Home',
    'admin.ticket_packages.field_featured_desc': 'Display this pass on the main homepage showcase (maximum 3).',
    'admin.ticket_packages.save_btn': 'Save Changes',
    'admin.ticket_packages.create_btn': 'Create Package',

    // Party Packages Tab
    'admin.party_packages.title': 'Manage Party Packages',
    'admin.party_packages.subtitle': 'Configure party themes, pricing, guest counts, and duration',
    'admin.party_packages.btn_new': 'New Party Package',
    'admin.party_packages.duration_label': 'Duration (minutes)',
    'admin.party_packages.loading': 'Loading party packages...',
    'admin.party_packages.empty_title': 'No party packages found',
    'admin.party_packages.empty_desc': 'Click "New Party Package" to add birthday party offerings.',
    'admin.party_packages.col_photo': 'Photo',
    'admin.party_packages.col_name': 'Theme / Package',
    'admin.party_packages.col_guests': 'Guests',
    'admin.party_packages.col_duration': 'Duration',
    'admin.party_packages.col_price': 'Price',
    'admin.party_packages.col_status': 'Status',
    'admin.party_packages.modal_new': 'New Party Package',
    'admin.party_packages.modal_edit': 'Edit Party Package',
    'admin.party_packages.field_name': 'Package / Theme Name',
    'admin.party_packages.field_description': 'Description and Inclusions',
    'admin.party_packages.field_photo': 'Illustrative Photo',
    'admin.party_packages.field_price': 'Total Price ($ USD)',
    'admin.party_packages.field_guests': 'Number of Guests',
    'admin.party_packages.field_duration': 'Duration (in minutes)',
    'admin.party_packages.field_status': 'Package Status',

    // Menu Tab
    'admin.menu_tab.title': 'Manage Menu & Food Court',
    'admin.menu_tab.subtitle': 'Manage dishes, portions, beverages, categories, and promotional banner',
    'admin.menu_tab.btn_new_item': 'Add Item',
    'admin.menu_tab.btn_new_category': 'New Category',
    'admin.menu_tab.subtab_items': 'Menu Items',
    'admin.menu_tab.subtab_categories': 'Categories',
    'admin.menu_tab.subtab_banner': 'Promotional Banner',
    'admin.menu_tab.loading': 'Loading menu items...',
    'admin.menu_tab.col_image': 'Image',
    'admin.menu_tab.col_name': 'Dish / Beverage Name',
    'admin.menu_tab.col_category': 'Category',
    'admin.menu_tab.col_price': 'Price',
    'admin.menu_tab.col_available': 'Availability',
    'admin.menu_tab.available': 'Available',
    'admin.menu_tab.unavailable': 'Unavailable',
    'admin.menu_tab.modal_new_item': 'New Menu Item',
    'admin.menu_tab.modal_edit_item': 'Edit Menu Item',
    'admin.menu_tab.modal_new_category': 'New Menu Category',
    'admin.menu_tab.modal_edit_category': 'Edit Category',
    'admin.menu_tab.field_item_name': 'Item Name',
    'admin.menu_tab.field_item_desc': 'Ingredients / Item Description',
    'admin.menu_tab.field_item_price': 'Price ($ USD)',
    'admin.menu_tab.field_item_category': 'Category',
    'admin.menu_tab.field_item_image': 'Dish / Beverage Photo',
    'admin.menu_tab.field_item_status': 'Available for Ordering',

    // Site Settings Tab
    'admin.settings.title': 'Home & General Settings',
    'admin.settings.subtitle': 'Background video, hero image, park hours, and contact details',
    'admin.settings.hero_title': 'Hero Video or Image',
    'admin.settings.hero_video_url': 'Background Video URL (MP4/WebM)',
    'admin.settings.hero_poster_url': 'Preload Poster Image URL',
    'admin.settings.contact_title': 'Contact & Location Info',
    'admin.settings.address': 'Full Park Address',
    'admin.settings.phone_primary': 'Primary Phone',
    'admin.settings.phone_secondary': 'Secondary Phone (Optional)',
    'admin.settings.email': 'Contact Email',
    'admin.settings.btn_save': 'Save Settings',
    'admin.settings.saving': 'Saving changes...',
    'admin.settings.save_success': 'Settings saved successfully!',
  },

  es: {
    // Header & Dashboard
    'admin.header.title': 'Panel de Control',
    'admin.header.subtitle': 'Gestión del Parque',
    'admin.header.view_site': 'Ver Sitio Público',
    'admin.header.site_short': 'Sitio',
    'admin.header.logout': 'Salir',
    'admin.header.logout_title': 'Cerrar Sesión',
    'admin.header.logout_confirm': '¿Está seguro de que desea salir del panel de administración?',
    'admin.header.logout_cancel': 'Cancelar',
    'admin.header.logout_action': 'Salir Ahora',
    'admin.header.language': 'Idioma del Panel',

    // Tabs
    'admin.tabs.tickets': 'Entradas',
    'admin.tabs.party_bookings': 'Reservas de Fiestas',
    'admin.tabs.party_calendar': 'Calendario de Fiestas',
    'admin.tabs.menu_orders': 'Pedidos del Menú',
    'admin.tabs.ticket_packages': 'Paquetes de Entradas',
    'admin.tabs.party_packages': 'Paquetes de Fiestas',
    'admin.tabs.menu': 'Menú',
    'admin.tabs.site_settings': 'Inicio y Configuración',

    // Common UI
    'admin.common.search': 'Buscar...',
    'admin.common.refresh': 'Actualizar',
    'admin.common.total': 'Total',
    'admin.common.loading': 'Cargando...',
    'admin.common.save': 'Guardar',
    'admin.common.saving': 'Guardando...',
    'admin.common.cancel': 'Cancelar',
    'admin.common.delete': 'Eliminar',
    'admin.common.edit': 'Editar',
    'admin.common.actions': 'Acción',
    'admin.common.status': 'Estado',
    'admin.common.date': 'Fecha',
    'admin.common.time': 'Horario',
    'admin.common.name': 'Nombre',
    'admin.common.email': 'Correo electrónico',
    'admin.common.phone': 'Teléfono',
    'admin.common.notes': 'Observaciones',
    'admin.common.close': 'Cerrar',
    'admin.common.back': 'Volver',
    'admin.common.confirm': 'Confirmar',
    'admin.common.active': 'Activo',
    'admin.common.inactive': 'Inactivo',
    'admin.common.yes': 'Sí',
    'admin.common.no': 'No',
    'admin.common.all': 'Todos',
    'admin.common.filter': 'Filtrar',
    'admin.common.price': 'Precio',
    'admin.common.details': 'Detalles',
    'admin.common.success': '¡Operación realizada con éxito!',
    'admin.common.error': 'Ocurrió un error.',

    // Statuses
    'admin.status.pending': 'Pendiente',
    'admin.status.paid': 'Pagado',
    'admin.status.confirmed': 'Confirmado',
    'admin.status.used': 'Utilizado',
    'admin.status.canceled': 'Cancelado',
    'admin.status.delivered': 'Entregado',
    'admin.status.preparing': 'Preparando',
    'admin.status.ready': 'Listo',

    // Tickets Tab
    'admin.tickets.search_placeholder': 'Buscar por nombre, correo o teléfono...',
    'admin.tickets.col_holder': 'Nombre del Titular',
    'admin.tickets.col_email': 'Correo',
    'admin.tickets.col_phone': 'Teléfono',
    'admin.tickets.col_package': 'Paquete',
    'admin.tickets.col_visit_date': 'Fecha de Visita',
    'admin.tickets.col_status': 'Estado',
    'admin.tickets.col_action': 'Acción',
    'admin.tickets.btn_validate': 'Marcar como Utilizado',
    'admin.tickets.validating': 'Validando...',
    'admin.tickets.validated_badge': 'Utilizado',
    'admin.tickets.checkin_done': 'Check-in realizado',
    'admin.tickets.empty_title': 'No se encontraron entradas',
    'admin.tickets.empty_desc': 'No hay entradas registradas en este momento.',
    'admin.tickets.empty_search': 'Ningún resultado coincide con "{term}".',
    'admin.tickets.loading': 'Cargando lista de entradas...',

    // Party Bookings Tab
    'admin.party_bookings.search_placeholder': 'Buscar por cliente, correo o teléfono...',
    'admin.party_bookings.single_count': 'reserva registrada',
    'admin.party_bookings.multiple_count': 'reservas registradas',
    'admin.party_bookings.payment_options': 'Opciones de Pago',
    'admin.party_bookings.col_responsible': 'Responsable',
    'admin.party_bookings.col_package': 'Paquete',
    'admin.party_bookings.col_date': 'Fecha del Evento',
    'admin.party_bookings.col_time': 'Horario',
    'admin.party_bookings.col_guests': 'Invitados',
    'admin.party_bookings.col_payment_type': 'Modalidad',
    'admin.party_bookings.col_total': 'Total',
    'admin.party_bookings.col_paid': 'Pagado',
    'admin.party_bookings.col_balance': 'Saldo Pendiente',
    'admin.party_bookings.btn_settle_balance': 'Liquidar Saldo',
    'admin.party_bookings.settled_badge': 'Liquidado',
    'admin.party_bookings.btn_view_notes': 'Ver Observaciones',
    'admin.party_bookings.btn_payment_settings': 'Formas de Pago de Fiestas',
    'admin.party_bookings.empty_title': 'No se encontraron reservas de fiestas',
    'admin.party_bookings.empty_desc': 'No hay reservas de fiestas registradas hasta el momento.',
    'admin.party_bookings.loading': 'Cargando reservas de fiestas...',
    'admin.party_bookings.pay_none': 'Sin Entrada ($0 ahora)',
    'admin.party_bookings.pay_deposit': 'Entrada Parcial',
    'admin.party_bookings.pay_full': 'Integral (100%)',

    // Party Calendar Tab
    'admin.calendar.title': 'Agenda Visual del Salón de Fiestas',
    'admin.calendar.subtitle': 'Control de exclusividad y horarios disponibles',
    'admin.calendar.today': 'Hoy',
    'admin.calendar.parties_count': '{count} fiesta(s)',
    'admin.calendar.select_day_title': 'Fiestas programadas para',
    'admin.calendar.no_parties_day': 'No hay fiestas programadas para esta fecha.',
    'admin.calendar.time_slot': 'Franja Horaria',
    'admin.calendar.balance_settle_btn': 'Marcar Saldo como Pagado Presencialmente',
    'admin.calendar.exclusivity_rule': 'Regla de Exclusividad: Solo 1 fiesta se realiza por franja horaria.',
    'admin.calendar.loading': 'Cargando calendario de fiestas...',

    // Menu Orders Tab
    'admin.menu_orders.search_placeholder': 'Buscar por cliente, correo, teléfono...',
    'admin.menu_orders.filter_all': 'Todos los Pedidos',
    'admin.menu_orders.col_order': 'Pedido',
    'admin.menu_orders.col_customer': 'Cliente',
    'admin.menu_orders.col_items': 'Artículos del Pedido',
    'admin.menu_orders.col_amount': 'Monto Total',
    'admin.menu_orders.col_status': 'Estado',
    'admin.menu_orders.btn_mark_ready': 'Marcar como Listo',
    'admin.menu_orders.btn_mark_delivered': 'Marcar como Entregado',
    'admin.menu_orders.empty_title': 'No se encontraron pedidos del menú',
    'admin.menu_orders.loading': 'Cargando pedidos del menú...',

    // Ticket Packages Tab
    'admin.ticket_packages.title': 'Administrar Paquetes de Entradas',
    'admin.ticket_packages.subtitle': 'Configure los pases vendidos en línea, precios y destacados en el Inicio.',
    'admin.ticket_packages.btn_new': 'Nuevo Paquete',
    'admin.ticket_packages.loading': 'Cargando paquetes de entradas...',
    'admin.ticket_packages.empty_title': 'No hay paquetes registrados',
    'admin.ticket_packages.empty_desc': 'Haga clic en "Nuevo Paquete" para agregar su primera opción de entrada.',
    'admin.ticket_packages.featured_home': 'Destacados Inicio',
    'admin.ticket_packages.col_photo': 'Foto',
    'admin.ticket_packages.col_name': 'Nombre del Paquete',
    'admin.ticket_packages.col_description': 'Descripción',
    'admin.ticket_packages.col_price': 'Precio',
    'admin.ticket_packages.col_order': 'Orden',
    'admin.ticket_packages.col_status': 'Estado',
    'admin.ticket_packages.col_featured': 'Destacado Inicio',
    'admin.ticket_packages.featured_badge': 'Destacado',
    'admin.ticket_packages.feature_btn': 'Destacar',
    'admin.ticket_packages.modal_new': 'Nuevo Paquete de Entrada',
    'admin.ticket_packages.modal_edit': 'Editar Paquete de Entrada',
    'admin.ticket_packages.field_name': 'Nombre del Paquete',
    'admin.ticket_packages.field_description': 'Descripción',
    'admin.ticket_packages.field_photo': 'Foto Ilustrativa',
    'admin.ticket_packages.field_price': 'Precio ($ USD)',
    'admin.ticket_packages.field_order': 'Orden de Visualización',
    'admin.ticket_packages.field_status': 'Estado del Paquete',
    'admin.ticket_packages.field_status_active': 'Disponible para compra',
    'admin.ticket_packages.field_status_inactive': 'Oculto en el sitio público',
    'admin.ticket_packages.field_featured': 'Destacar en Inicio',
    'admin.ticket_packages.field_featured_desc': 'Mostrar este pase en la vitrina principal de la página de inicio (máximo 3).',
    'admin.ticket_packages.save_btn': 'Guardar Cambios',
    'admin.ticket_packages.create_btn': 'Crear Paquete',

    // Party Packages Tab
    'admin.party_packages.title': 'Administrar Paquetes de Fiestas',
    'admin.party_packages.subtitle': 'Configure temas, precios, cantidad de invitados y duración de fiestas',
    'admin.party_packages.btn_new': 'Nuevo Paquete de Fiesta',
    'admin.party_packages.duration_label': 'Duración (en minutos)',
    'admin.party_packages.loading': 'Cargando paquetes de fiestas...',
    'admin.party_packages.empty_title': 'No hay paquetes de fiestas registrados',
    'admin.party_packages.empty_desc': 'Haga clic en "Nuevo Paquete de Fiesta" para registrar opciones.',
    'admin.party_packages.col_photo': 'Foto',
    'admin.party_packages.col_name': 'Tema / Paquete',
    'admin.party_packages.col_guests': 'Invitados',
    'admin.party_packages.col_duration': 'Duración',
    'admin.party_packages.col_price': 'Precio',
    'admin.party_packages.col_status': 'Estado',
    'admin.party_packages.modal_new': 'Nuevo Paquete de Fiesta',
    'admin.party_packages.modal_edit': 'Editar Paquete de Fiesta',
    'admin.party_packages.field_name': 'Nombre del Paquete / Tema',
    'admin.party_packages.field_description': 'Descripción y Artículos Incluidos',
    'admin.party_packages.field_photo': 'Foto Ilustrativa',
    'admin.party_packages.field_price': 'Precio Total ($ USD)',
    'admin.party_packages.field_guests': 'Número de Invitados',
    'admin.party_packages.field_duration': 'Duración (en minutos)',
    'admin.party_packages.field_status': 'Estado del Paquete',

    // Menu Tab
    'admin.menu_tab.title': 'Administrar Menú & Gastronomía',
    'admin.menu_tab.subtitle': 'Control de platos, porciones, bebidas, categorías y banner promocional',
    'admin.menu_tab.btn_new_item': 'Agregar Artículo',
    'admin.menu_tab.btn_new_category': 'Nueva Categoría',
    'admin.menu_tab.subtab_items': 'Artículos del Menú',
    'admin.menu_tab.subtab_categories': 'Categorías',
    'admin.menu_tab.subtab_banner': 'Banner Promocional',
    'admin.menu_tab.loading': 'Cargando artículos del menú...',
    'admin.menu_tab.col_image': 'Imagen',
    'admin.menu_tab.col_name': 'Nombre del Plato / Bebida',
    'admin.menu_tab.col_category': 'Categoría',
    'admin.menu_tab.col_price': 'Precio',
    'admin.menu_tab.col_available': 'Disponibilidad',
    'admin.menu_tab.available': 'Disponible',
    'admin.menu_tab.unavailable': 'No disponible',
    'admin.menu_tab.modal_new_item': 'Nuevo Artículo del Menú',
    'admin.menu_tab.modal_edit_item': 'Editar Artículo del Menú',
    'admin.menu_tab.modal_new_category': 'Nueva Categoría del Menú',
    'admin.menu_tab.modal_edit_category': 'Editar Categoría',
    'admin.menu_tab.field_item_name': 'Nombre del Artículo',
    'admin.menu_tab.field_item_desc': 'Ingredientes / Descripción',
    'admin.menu_tab.field_item_price': 'Precio ($ USD)',
    'admin.menu_tab.field_item_category': 'Categoría',
    'admin.menu_tab.field_item_image': 'Foto del Plato / Bebida',
    'admin.menu_tab.field_item_status': 'Disponible para Pedidos',

    // Site Settings Tab
    'admin.settings.title': 'Inicio y Configuración General',
    'admin.settings.subtitle': 'Video de fondo, imágenes destacadas, horarios y contactos del parque',
    'admin.settings.hero_title': 'Video o Imagen Destacada (Hero)',
    'admin.settings.hero_video_url': 'URL del Video de Fondo (MP4/WebM)',
    'admin.settings.hero_poster_url': 'URL de Imagen Poster (Precarga)',
    'admin.settings.contact_title': 'Información de Contacto y Ubicación',
    'admin.settings.address': 'Dirección Completa del Parque',
    'admin.settings.phone_primary': 'Teléfono Principal',
    'admin.settings.phone_secondary': 'Teléfono Secundario (Opcional)',
    'admin.settings.email': 'Correo de Contacto',
    'admin.settings.btn_save': 'Guardar Configuración',
    'admin.settings.saving': 'Guardando cambios...',
    'admin.settings.save_success': '¡Configuración guardada con éxito!',
  },
};

interface AdminLanguageContextValue {
  language: AdminLanguage;
  setLanguage: (lang: AdminLanguage) => void;
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string, fallback?: string) => string;
  monthNames: string[];
  weekDays: string[];
}

const AdminLanguageContext = createContext<AdminLanguageContextValue>({
  language: 'pt',
  setLanguage: () => {},
  t: (key: string) => key,
  monthNames: ADMIN_MONTH_NAMES.pt,
  weekDays: ADMIN_WEEK_DAYS.pt,
});

export const ADMIN_STORAGE_KEY = 'admin_language';

export function AdminLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>('pt');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ADMIN_STORAGE_KEY) as AdminLanguage;
      if (saved && (saved === 'pt' || saved === 'en' || saved === 'es')) {
        setLanguageState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (newLang: AdminLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(ADMIN_STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  };

  const t = (
    key: string,
    paramsOrFallback?: Record<string, string | number> | string,
    fallback?: string
  ): string => {
    const dict = ADMIN_TRANSLATIONS[language] || ADMIN_TRANSLATIONS.pt;
    let template = dict[key] || ADMIN_TRANSLATIONS.pt[key];

    let actualFallback = '';
    let params: Record<string, string | number> | undefined;

    if (typeof paramsOrFallback === 'string') {
      actualFallback = paramsOrFallback;
    } else if (typeof paramsOrFallback === 'object' && paramsOrFallback !== null) {
      params = paramsOrFallback;
      if (fallback) actualFallback = fallback;
    }

    if (!template) {
      template = actualFallback || key;
    }

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        template = template.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }

    return template;
  };

  const monthNames = ADMIN_MONTH_NAMES[language] || ADMIN_MONTH_NAMES.pt;
  const weekDays = ADMIN_WEEK_DAYS[language] || ADMIN_WEEK_DAYS.pt;

  return (
    <AdminLanguageContext.Provider value={{ language, setLanguage, t, monthNames, weekDays }}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLanguage() {
  return useContext(AdminLanguageContext);
}
