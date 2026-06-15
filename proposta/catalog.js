// Catalog.js — services with per-service config + pricing

window.CATALOG = {
  services: [
    {
      id: "branding",
      num: "01",
      title: "Branding &",
      titleEm: "Identidade",
      lead: "Identidades visuais que traduzem o posicionamento da marca de forma clara, consistente e atual.",
      body: "Do conceito aos elementos visuais — cores, tipografia, aplicações. Marcas com personalidade, coerência e facilidade de uso no dia a dia.",
      includes: [
        "Pesquisa & moodboard",
        "Logo + variações",
        "Paleta de cores & tipografia",
        "Manual de marca essencial",
        "Aplicações básicas",
      ],
      configKind: "tiers",
      tiers: [
        // ⚠️ valores placeholder — ajuste no arquivo catalog.js
        {
          id: "branding-logo",
          name: "Logo Essencial",
          desc: "o ponto de partida — sua marca nascendo com cara profissional.",
          price: 1200,
          deliverables: [
            "Logo principal + 2 variações",
            "Paleta de cores (até 4)",
            "Tipografia da marca",
            "2 mockups de aplicação",
            "Arquivos finais (PNG · JPG · PDF · SVG)",
          ],
        },
        {
          id: "branding-visual",
          name: "Identidade Visual",
          desc: "identidade completa, com brandbook pra aplicar sem errar.",
          price: 2800,
          featured: true,
          deliverables: [
            "Tudo do Logo Essencial",
            "Logo + 3 variações + submarca",
            "4 mockups de aplicação",
            "Kit básico de redes sociais (5 templates)",
          ],
          highlights: [
            "Brandbook essencial — guia de marca em PDF",
          ],
        },
        {
          id: "branding-full",
          name: "Branding Completo",
          desc: "o pacote premium — marca, brandbook e imagens pra vender mais.",
          price: 4500,
          deliverables: [
            "Tudo da Identidade Visual",
            "Logo + família completa de variações",
            "8 mockups premium de aplicação",
            "Kit completo de redes sociais (12 templates)",
            "Papelaria & aplicações estendidas",
          ],
          highlights: [
            "Brandbook completo — manual de marca",
            "5 fotos de produto/cena geradas por IA",
          ],
        },
      ],
      // Adicionais & Extras — complementam qualquer tier do Branding
      addonsLead: "cada projeto é diferente. estes itens complementam o pacote escolhido e você adiciona só o que faz sentido.",
      addons: [
        {
          num: "01", name: "Papelaria Individual", badge: "papelaria", cls: "papelaria",
          items: [
            { id: "addon-cartao",   name: "Cartão de Visita",      price: 380, desc: "frente e verso, arquivo finalizado para gráfica." },
            { id: "addon-timbrado", name: "Papel Timbrado",        price: 280, desc: "template A4 editável (Word ou Google Docs)." },
            { id: "addon-envelope", name: "Envelope",              price: 240, desc: "modelo saco ou americano com logotipo aplicado." },
            { id: "addon-assin",    name: "Assinatura de E-mail",  price: 260, desc: "HTML responsivo compatível com Gmail e Outlook." },
            { id: "addon-pasta",    name: "Pasta de Apresentação", price: 400, desc: "frente, verso e bolso interno, pronto para gráfica." },
            { id: "addon-etiqueta", name: "Etiqueta / Tag",        price: 200, desc: "frente e verso para produto, sacola ou embrulho." },
          ],
        },
        {
          num: "02", name: "Redes Sociais · Extras", badge: "social", cls: "social",
          hint: "além dos templates já inclusos nos pacotes",
          items: [
            { id: "addon-tpl-extra", name: "Pack de Templates Extras (+5 layouts)", price: 420 },
            { id: "addon-capas",     name: "Capas para Redes (até 2 redes)",       price: 220 },
            { id: "addon-highlight", name: "Capas de Highlight (pack 10 ícones)",  price: 280 },
            { id: "addon-gif",       name: "GIF / Animação para Stories",          price: 380 },
          ],
        },
        {
          num: "03", name: "Apresentações & Documentos", badge: "apresentação", cls: "apres",
          items: [
            { id: "addon-tpl-apres", name: "Template de Apresentação (até 20 slides)", price: 850 },
            { id: "addon-pitch",     name: "Pitch Deck Completo",                     price: 1400 },
            { id: "addon-tpl-prop",  name: "Template de Proposta Comercial",          price: 650 },
          ],
        },
        {
          num: "04", name: "Full Branding · Adicionais", badge: "full branding", cls: "full",
          items: [
            { id: "addon-anim-logo", name: "Animação do Logo (MP4 + GIF)",         price: 850 },
            { id: "addon-voice",     name: "Brand Voice / Tom de Voz",             price: 550 },
            { id: "addon-embalagem", name: "Embalagem / Rótulo",                   price: 1100 },
            { id: "addon-site",      name: "Identidade para Site / Landing Page",  price: 1100 },
            { id: "addon-sinal",     name: "Sinalização / Fachada",                price: 750 },
            { id: "addon-uniforme",  name: "Uniformes / Vestuário",                price: 650 },
            { id: "addon-flyers",    name: "Flyers / Banners (2 layouts)",         price: 400 },
          ],
        },
        {
          num: "05", name: "Fotos Geradas por IA · Extras", badge: "foto ia", cls: "foto",
          hint: "Branding Completo já inclui 5 fotos",
          items: [
            { id: "addon-ia5",  name: "Pack 5 imagens",  price: 320 },
            { id: "addon-ia10", name: "Pack 10 imagens", price: 580 },
          ],
        },
      ],
      startsAt: 1200,
    },
    {
      id: "criativos",
      num: "02",
      title: "Criativos",
      titleEm: "Estáticos",
      lead: "Peças visuais para redes sociais e campanhas — impacto e comunicação objetiva.",
      body: "Criados pra chamar atenção, reforçar a mensagem e gerar resultado, respeitando o branding e o contexto (ads, orgânico, lançamentos).",
      includes: [
        "Posts únicos para feed",
        "Carrosseis até 8 páginas",
        "Banners mobile / desktop",
        "Vídeos curtos editados",
      ],
      configKind: "pieces-or-package",
      pieces: [
        { id: "post-unico", label: "Post Único",        meta: "feed instagram",  price: 150 },
        { id: "carrossel",  label: "Carrossel",         meta: "até 8 páginas",   price: 180 },
        { id: "banner",     label: "Banner",            meta: "mobile/desktop",  price: 180 },
        { id: "video",      label: "Vídeo curto",       meta: "editado",         price: 220 },
      ],
      packages: [
        { id: "pkg-light",     name: "Pacote Light",     qty: 5,  total: 650,  unit: 130 },
        { id: "pkg-essencial", name: "Pacote Essencial", qty: 10, total: 1200, unit: 120, featured: true },
        { id: "pkg-plus",      name: "Pacote Plus",      qty: 20, total: 2200, unit: 110 },
      ],
      startsAt: 150,
    },
    {
      id: "email",
      num: "03",
      title: "E-mail",
      titleEm: "Marketing",
      lead: "E-mails estratégicos focados em conversão — layout, hierarquia visual e mensagem alinhados.",
      body: "Peças que conversam com a identidade da marca, facilitam a leitura e conduzem o usuário para a ação: venda, relacionamento ou lançamento.",
      includes: [
        "Layout responsivo",
        "Hierarquia visual estratégica",
        "Copy alinhado ao branding",
        "Arquivo pronto pra disparo",
      ],
      configKind: "quantity",
      pricePerUnit: 170,
      unitLabel: "e-mail",
      minQty: 1,
      maxQty: 10,
      defaultQty: 1,
      startsAt: 170,
    },
    {
      id: "shooting",
      num: "04",
      title: "Visual",
      titleEm: "Shooting",
      lead: "Shootings com direção criativa, conceito e curadoria — produção visual com IA como aliada.",
      body: "Imagens que despertam desejo, constroem narrativa e reforçam identidade. Cenas com intenção, estética e estratégia — não só produto isolado.",
      includes: [
        "Direção criativa & conceito",
        "Curadoria estética",
        "Produção visual com IA",
        "Imagens finalizadas em alta",
      ],
      configKind: "tiers",
      tiers: [
        // ⚠️ valores placeholder — ajuste no arquivo catalog.js
        { id: "shoot-mini",     name: "Mini Sessão",      desc: "5 imagens conceituais",            price: 650 },
        { id: "shoot-completa", name: "Sessão Completa",  desc: "10 imagens + variações",           price: 1100, featured: true },
        { id: "shoot-campanha", name: "Campanha Plus",    desc: "20 imagens + narrativa visual",    price: 1900 },
      ],
      startsAt: 650,
    },
  ],

  // Phone for WhatsApp
  phone: "5571992912706",
  phoneDisplay: "(71) 99291-2706",
  email: "brucristina.design@gmail.com",
  instagram: "@brucristina.design",
};

// Look up a tier/package scope by cart-line id (for showing what's included)
window.CATALOG.scopeById = function (id) {
  for (const s of window.CATALOG.services) {
    for (const t of (s.tiers || [])) if (t.id === id) return t;
    for (const p of (s.packages || [])) if (p.id === id) return p;
  }
  return null;
};
