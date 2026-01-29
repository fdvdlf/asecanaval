export type NewsSource = {
  id: string;
  name: string;
  url: string;
  category:
    | 'internacional'
    | 'general'
    | 'politica'
    | 'economia'
    | 'tecnologia'
    | 'opinion'
    | 'ciencia'
    | 'sociedad'
    | 'cultura'
    | 'deportes'
    | 'latam'
    | 'actualidad'
    | 'defensa_seguridad'
    | 'maritimo_logistica'
    | 'geopolitica_thinktank';
  language?: string;
  homepage?: string;
};

export const NEWS_SOURCES: NewsSource[] = [
  {
    id: 'bbc_mundo',
    name: 'BBC News Mundo',
    category: 'internacional',
    language: 'es',
    url: 'https://feeds.bbci.co.uk/mundo/rss.xml',
    homepage: 'https://www.bbc.com/mundo',
  },
  {
    id: 'dw_es_all',
    name: 'DW Español (todas)',
    category: 'internacional',
    language: 'es',
    url: 'https://rss.dw.com/rdf/rss-es-all',
    homepage: 'https://www.dw.com/es',
  },
  {
    id: 'france24_es',
    name: 'France 24 Español (RSS)',
    category: 'internacional',
    language: 'es',
    url: 'https://www.france24.com/es/rss',
    homepage: 'https://www.france24.com/es/',
  },
  {
    id: 'euronews_es_news',
    name: 'Euronews Español (News)',
    category: 'internacional',
    language: 'es',
    url: 'https://es.euronews.com/rss?level=vertical&name=news',
    homepage: 'https://es.euronews.com/',
  },
  {
    id: 'elpais_portada',
    name: 'EL PAÍS (Portada)',
    category: 'general',
    language: 'es',
    url: 'https://elpais.com/rss/elpais/portada.xml',
    homepage: 'https://elpais.com/',
  },
  {
    id: 'elpais_portada_completo',
    name: 'EL PAÍS (Portada completa)',
    category: 'general',
    language: 'es',
    url: 'https://elpais.com/rss/elpais/portada_completo.xml',
    homepage: 'https://elpais.com/',
  },
  {
    id: 'elpais_internacional',
    name: 'EL PAÍS (Internacional)',
    category: 'internacional',
    language: 'es',
    url: 'https://elpais.com/rss/internacional/portada.xml',
    homepage: 'https://elpais.com/internacional/',
  },
  {
    id: 'elpais_politica',
    name: 'EL PAÍS (Política)',
    category: 'politica',
    language: 'es',
    url: 'https://elpais.com/rss/politica/portada.xml',
    homepage: 'https://elpais.com/politica/',
  },
  {
    id: 'elpais_economia',
    name: 'EL PAÍS (Economía)',
    category: 'economia',
    language: 'es',
    url: 'https://economia.elpais.com/rss/economia/portada.xml',
    homepage: 'https://elpais.com/economia/',
  },
  {
    id: 'elpais_tecnologia',
    name: 'EL PAÍS (Tecnología)',
    category: 'tecnologia',
    language: 'es',
    url: 'https://elpais.com/rss/tecnologia/portada.xml',
    homepage: 'https://elpais.com/tecnologia/',
  },
  {
    id: 'elpais_opinion',
    name: 'EL PAÍS (Opinión)',
    category: 'opinion',
    language: 'es',
    url: 'https://elpais.com/rss/elpais/opinion.xml',
    homepage: 'https://elpais.com/opinion/',
  },
  {
    id: 'elpais_ciencia',
    name: 'EL PAÍS (Ciencia / Materia)',
    category: 'ciencia',
    language: 'es',
    url: 'https://elpais.com/rss/elpais/ciencia.xml',
    homepage: 'https://elpais.com/ciencia/',
  },
  {
    id: 'elpais_sociedad',
    name: 'EL PAÍS (Sociedad)',
    category: 'sociedad',
    language: 'es',
    url: 'https://sociedad.elpais.com/rss/sociedad/portada.xml',
    homepage: 'https://elpais.com/sociedad/',
  },
  {
    id: 'elpais_cultura',
    name: 'EL PAÍS (Cultura)',
    category: 'cultura',
    language: 'es',
    url: 'https://elpais.com/rss/cultura/portada.xml',
    homepage: 'https://elpais.com/cultura/',
  },
  {
    id: 'elpais_deportes',
    name: 'EL PAÍS (Deportes)',
    category: 'deportes',
    language: 'es',
    url: 'https://elpais.com/rss/deportes/portada.xml',
    homepage: 'https://elpais.com/deportes/',
  },
  {
    id: 'elpais_portada_america',
    name: 'EL PAÍS (Portada América)',
    category: 'latam',
    language: 'es',
    url: 'https://elpais.com/rss/elpais/portada_america.xml',
    homepage: 'https://elpais.com/america/',
  },
  {
    id: 'lavanguardia_internacional',
    name: 'La Vanguardia (Internacional)',
    category: 'internacional',
    language: 'es',
    url: 'https://www.lavanguardia.com/topics/rss/internacional',
    homepage: 'https://www.lavanguardia.com/internacional',
  },
  {
    id: 'lavanguardia_politica',
    name: 'La Vanguardia (Política)',
    category: 'politica',
    language: 'es',
    url: 'https://www.lavanguardia.com/topics/rss/politica',
    homepage: 'https://www.lavanguardia.com/politica',
  },
  {
    id: 'lavanguardia_economia',
    name: 'La Vanguardia (Economía)',
    category: 'economia',
    language: 'es',
    url: 'https://www.lavanguardia.com/rss/economia.xml',
    homepage: 'https://www.lavanguardia.com/economia',
  },
  {
    id: 'lavanguardia_opinion',
    name: 'La Vanguardia (Opinión)',
    category: 'opinion',
    language: 'es',
    url: 'https://www.lavanguardia.com/rss/opinion.xml',
    homepage: 'https://www.lavanguardia.com/opinion',
  },
  {
    id: 'lavanguardia_sociedad',
    name: 'La Vanguardia (Sociedad)',
    category: 'sociedad',
    language: 'es',
    url: 'https://www.lavanguardia.com/rss/vida.xml',
    homepage: 'https://www.lavanguardia.com/vida',
  },
  {
    id: 'lavanguardia_sucesos',
    name: 'La Vanguardia (Sucesos)',
    category: 'actualidad',
    language: 'es',
    url: 'https://www.lavanguardia.com/rss/sucesos.xml',
    homepage: 'https://www.lavanguardia.com/sucesos',
  },
  {
    id: 'elconfidencial_mundo',
    name: 'El Confidencial (Mundo)',
    category: 'internacional',
    language: 'es',
    url: 'https://rss.elconfidencial.com/mundo/',
    homepage: 'https://www.elconfidencial.com/mundo/',
  },
  {
    id: 'infodefensa_all',
    name: 'Infodefensa (Todas)',
    category: 'defensa_seguridad',
    language: 'es',
    url: 'https://www.infodefensa.com/rss.php',
    homepage: 'https://www.infodefensa.com/',
  },
  {
    id: 'infodefensa_america',
    name: 'Infodefensa (América)',
    category: 'defensa_seguridad',
    language: 'es',
    url: 'https://www.infodefensa.com/rss_ame.php',
    homepage: 'https://www.infodefensa.com/',
  },
  {
    id: 'infodefensa_mundo',
    name: 'Infodefensa (Mundo)',
    category: 'defensa_seguridad',
    language: 'es',
    url: 'https://www.infodefensa.com/rss_mun.php',
    homepage: 'https://www.infodefensa.com/',
  },
  {
    id: 'gestion_mundo',
    name: 'Diario Gestión (Mundo)',
    category: 'internacional',
    language: 'es',
    url: 'https://gestion.pe/arc/outboundfeeds/rss/category/mundo/?outputType=xml',
    homepage: 'https://gestion.pe/mundo/',
  },
  {
    id: 'gestion_economia',
    name: 'Diario Gestión (Economía)',
    category: 'economia',
    language: 'es',
    url: 'https://gestion.pe/arc/outboundfeeds/rss/category/economia/?outputType=xml',
    homepage: 'https://gestion.pe/economia/',
  },
  {
    id: 'elcomercio_mundo',
    name: 'El Comercio (Mundo)',
    category: 'internacional',
    language: 'es',
    url: 'https://elcomercio.pe/rss/mundo.xml',
    homepage: 'https://elcomercio.pe/mundo/',
  },
  {
    id: 'elcomercio_ultimas',
    name: 'El Comercio (Últimas noticias)',
    category: 'general',
    language: 'es',
    url: 'https://elcomercio.pe/rss/ultimas-noticias.xml',
    homepage: 'https://elcomercio.pe/ultimas-noticias/',
  },
  {
    id: 'mundomaritimo',
    name: 'MundoMaritimo.cl (Noticias)',
    category: 'maritimo_logistica',
    language: 'es',
    url: 'https://www.mundomaritimo.cl/rss/feed',
    homepage: 'https://www.mundomaritimo.cl/',
  },
  {
    id: 'elcano_feed',
    name: 'Real Instituto Elcano (feed)',
    category: 'geopolitica_thinktank',
    language: 'es',
    url: 'https://www.realinstitutoelcano.org/feed/',
    homepage: 'https://www.realinstitutoelcano.org/',
  },
];
