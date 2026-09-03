import { Category, Transaction, TransactionType } from '@/types';

// Normaliza texto removendo acentos, pontuações e espaços extras
export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Palavras genéricas/ruídos de extratos bancários que não identificam o estabelecimento
const BANK_NOISE_WORDS = new Set([
  'pix', 'transf', 'transferencia', 'ted', 'doc', 'pagto', 'pagamento',
  'compra', 'debito', 'credito', 'deb', 'cred', 'enviada', 'enviado',
  'recebida', 'recebido', 'banco', 'sa', 'ltda', 'me', 'epp', 'eireli',
  'br', 'com', 'de', 'da', 'do', 'dos', 'das', 'para', 'em', 'no', 'na',
  'cartao', 'fatura', 'parcela', 'via', 'auto', 'atendimento', 'terminal',
  'agencia', 'conta', 'int', 'nacional', 'internacional', 'iof', 'tarifa',
  'estorno', 'liquidacao', 'titulo', 'cobranca', 'autorizacao', 'deposito',
  'dinheiro', 'saldo', 'extrato', 'movimento', 'lancamento', 'historico'
]);

// Dicionário inteligente semântico mapeando grupos de termos para possíveis nomes de categorias
const SMART_KEYWORDS_MAP: { keywords: string[]; categoryPatterns: string[]; type?: TransactionType }[] = [
  {
    // Casa / Habitação / Contas de consumo
    keywords: [
      'cemig', 'copel', 'enel', 'cpfl', 'eletropaulo', 'energisa', 'edp', 'coelba', 'celpe', 'celesc', 'equatorial', 'luz', 'energia', 'eletricidade',
      'copasa', 'sabesp', 'sanepar', 'compesa', 'embasa', 'caesb', 'corsan', 'cedae', 'agua', 'esgoto', 'saneamento',
      'aluguel', 'condominio', 'iptu', 'gas', 'supergasbras', 'ultragaz', 'consigaz', 'imobiliaria', 'quinto andar', 'quintoandar', 'loft',
      'reforma', 'construcao', 'telhanorte', 'leroy', 'leroy merlin', 'c&c', 'madeira madeira', 'tok&stok', 'tok stok', 'camicado'
    ],
    categoryPatterns: ['casa', 'moradia', 'habitacao', 'residencia', 'contas', 'imovel', 'lar'],
    type: 'expense'
  },
  {
    // Alimentação / Supermercado / Restaurantes
    keywords: [
      'supermercado', 'mercado', 'hipermercado', 'carrefour', 'pao de acucar', 'extra', 'atacadao', 'assai', 'sams club', 'supermercados bh', 'super nosso', 'dia brasil', 'mambo', 'zaffari',
      'hortifruti', 'sacolao', 'feira', 'padaria', 'panificadora', 'acougue', 'peixaria', 'emporio',
      'restaurante', 'lanchonete', 'ifood', 'rappi', 'uber eats', 'mcdonald', 'mcdonalds', 'burger king', 'habib', 'habibs', 'subway', 'bobs', 'starbucks', 'outback', 'madero',
      'pizzaria', 'pizza', 'sushi', 'churrascaria', 'cafeteria', 'cafe', 'bar', 'choperia', 'pub', 'boteco', 'refeicao', 'almoco', 'jantar', 'lanche'
    ],
    categoryPatterns: ['alimentacao', 'mercado', 'supermercado', 'restaurante', 'comida', 'refeicao'],
    type: 'expense'
  },
  {
    // Transporte / Combustível / Mobilidade
    keywords: [
      'uber', '99app', '99 app', '99 tecnologia', '99 pop', 'cabify', 'indrive', 'taxi',
      'posto', 'ipiranga', 'shell', 'petrobras', 'br distribuidora', 'ale combustiveis', 'abastece', 'combustivel', 'gasolina', 'etanol', 'diesel',
      'pedagio', 'sem parar', 'semparar', 'conectcar', 'veloe', 'taggy', 'estacionamento', 'estapar', 'zona azul',
      'oficina', 'mecanica', 'auto pecas', 'pneus', 'ipva', 'detran', 'dpvat', 'multa', 'licenciamento',
      'onibus', 'metro', 'cptm', 'passagem', 'rodoviaria', 'bilhete unico'
    ],
    categoryPatterns: ['transporte', 'veiculo', 'carro', 'combustivel', 'mobilidade', 'auto'],
    type: 'expense'
  },
  {
    // Saúde / Medicamentos / Cuidados
    keywords: [
      'drogaria', 'farmacia', 'droga raia', 'drogasil', 'pacheco', 'drogarias pacheco', 'drogaria sao paulo', 'paguemenos', 'pague menos', 'araujo', 'panvel', 'nissei',
      'remedio', 'medicamento', 'laboratorio', 'hermes pardini', 'fleury', 'delboni', 'lavoisier', 'exame',
      'consulta', 'medico', 'clinica', 'hospital', 'dentista', 'odontologia', 'odonto', 'terapia', 'psicologo', 'psiquiatra', 'fisioterapia',
      'plano de saude', 'unimed', 'bradesco saude', 'amil', 'sulamerica', 'notredame', 'intermedica', 'otica', 'oftalmo'
    ],
    categoryPatterns: ['saude', 'farmacia', 'medico', 'cuidados', 'hospital'],
    type: 'expense'
  },
  {
    // Lazer / Entretenimento / Streaming / Viagem
    keywords: [
      'netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'hbo', 'max', 'globoplay', 'youtube', 'deezer', 'apple music', 'paramount', 'star+',
      'cinema', 'cinemark', 'cinepolis', 'uci', 'ingresso', 'sympla', 'eventim', 'show', 'teatro', 'museu', 'parque',
      'viagem', 'hotel', 'booking', 'airbnb', 'decolar', 'cvc', 'gol linhas', 'gol', 'latam', 'azul linhas', 'voeazul', 'passagens',
      'steam', 'playstation', 'psn', 'xbox', 'nintendo', 'jogos', 'games', 'riot games', 'blizzard',
      'salao de beleza', 'barbearia', 'cabeleireiro', 'manicure', 'estetica', 'depilacao'
    ],
    categoryPatterns: ['lazer', 'entretenimento', 'streaming', 'viagem', 'passeios', 'diversao'],
    type: 'expense'
  },
  {
    // Educação / Livros
    keywords: [
      'escola', 'colegio', 'faculdade', 'universidade', 'curso', 'mensalidade escolar', 'mensalidade', 'pos graduacao', 'mba',
      'puc', 'fgv', 'estacio', 'anhanguera', 'unip', 'udemy', 'coursera', 'alura', 'rocketseat', 'idiomas', 'ingles', 'wizard', 'cna', 'fisk',
      'livro', 'livros', 'livraria', 'saraiva', 'leitura', 'papelaria', 'material escolar'
    ],
    categoryPatterns: ['educacao', 'cursos', 'estudos', 'escola', 'livros'],
    type: 'expense'
  },
  {
    // Compras / Vestuário / Eletrônicos
    keywords: [
      'zara', 'renner', 'c&a', 'cea', 'riachuelo', 'shein', 'shopee', 'aliexpress', 'mercado livre', 'mercadolivre', 'amazon',
      'magazine luiza', 'magalu', 'casas bahia', 'ponto frio', 'americanas', 'submarino', 'shoptime',
      'kabum', 'pichau', 'terabyte', 'fast shop', 'apple', 'samsung', 'dell',
      'centauro', 'decathlon', 'nike', 'adidas', 'calcados', 'roupas', 'vestuario'
    ],
    categoryPatterns: ['compras', 'vestuario', 'roupas', 'eletronicos', 'shopping', 'bens'],
    type: 'expense'
  },
  {
    // Telecom / Assinaturas de Internet e Celular
    keywords: [
      'claro', 'vivo', 'tim', 'oi', 'net servicos', 'embratel', 'algar', 'internet', 'banda larga', 'provedor',
      'telefonia', 'celular', 'recarga', 'recargapay',
      'aws', 'google cloud', 'icloud', 'google storage', 'microsoft', 'chatgpt', 'openai', 'github', 'adobe'
    ],
    categoryPatterns: ['assinaturas', 'servicos', 'internet', 'telefone', 'comunicacao', 'tecnologia'],
    type: 'expense'
  },
  {
    // Finanças / Empréstimos / Taxas
    keywords: [
      'emprestimo', 'financiamento', 'consorcio', 'anuidade', 'tarifa', 'iof', 'juros', 'seguro',
      'porto seguro', 'tokio marine', 'azul seguros', 'mapfre', 'bradesco seguros', 'caixa seguradora'
    ],
    categoryPatterns: ['servicos financeiros', 'taxas', 'financiamentos', 'impostos', 'seguros'],
    type: 'expense'
  },
  {
    // Salário / Proventos / Receitas
    keywords: [
      'salario', 'remuneracao', 'proventos', 'folha pagto', 'folha pagamento', 'adiantamento salarial',
      'pro-labore', 'pro labore', '13 salario', 'decimo terceiro', 'ferias', 'rescisao', 'clt',
      'rendimento', 'rendimentos', 'dividendos', 'jcp', 'aluguel recebido', 'restituicao', 'comissao', 'honorarios'
    ],
    categoryPatterns: ['salario', 'renda', 'receita', 'rendimentos', 'proventos', 'remuneracao'],
    type: 'income'
  }
];

export function determineCategoryForTransaction(
  description: string,
  type: TransactionType,
  categories: Category[],
  existingTransactions: Transaction[]
): string {
  if (!categories || categories.length === 0) return '';

  const normDesc = normalizeText(description);
  if (!normDesc) {
    return getDefaultCategoryForType(type, categories);
  }

  const descWords = normDesc
    .split(' ')
    .filter(w => w.length >= 3 && !BANK_NOISE_WORDS.has(w));

  // =========================================================================
  // ETAPA 1: VARREDURA NOS DADOS EXISTENTES (HISTÓRICO DO USUÁRIO)
  // Identifica padrões recorrentes no histórico de transações
  // =========================================================================
  if (existingTransactions && existingTransactions.length > 0) {
    const categoryScores = new Map<string, number>();
    const validCategoryIds = new Set(categories.map(c => c.id));

    for (const t of existingTransactions) {
      if (!t.categoryId || !validCategoryIds.has(t.categoryId)) continue;

      const normExisting = normalizeText(t.description);
      if (!normExisting) continue;

      let score = 0;

      // 1.1 Match exato de descrição normalizada
      if (normExisting === normDesc) {
        score += 100;
      }
      // 1.2 Substring completa (ex: "cemig" está em "pix transf cemig distribuicao sa")
      else if (normExisting.length >= 3 && normDesc.includes(normExisting)) {
        score += 70;
      } else if (normDesc.length >= 3 && normExisting.includes(normDesc)) {
        score += 60;
      }

      // 1.3 Coincidência de palavras significativas
      const existingWords = normExisting
        .split(' ')
        .filter(w => w.length >= 3 && !BANK_NOISE_WORDS.has(w));

      for (const word of descWords) {
        if (existingWords.includes(word)) {
          // Palavras com 4 ou mais letras (ex: CEMIG, IFOOD, NETFLIX, UBER, FARMACIA) têm peso forte
          score += word.length >= 4 ? 25 : 12;
        } else {
          // Checa se uma palavra contém a outra (ex: "drogasil" e "drogasilsa")
          for (const ew of existingWords) {
            if ((word.length >= 4 && ew.includes(word)) || (ew.length >= 4 && word.includes(ew))) {
              score += 15;
              break;
            }
          }
        }
      }

      // Se for do mesmo tipo (receita com receita, despesa com despesa), ganha bônus de consistência
      if (t.type === type && score > 0) {
        score += 10;
      }

      if (score > 0) {
        categoryScores.set(t.categoryId, (categoryScores.get(t.categoryId) || 0) + score);
      }
    }

    // Se encontramos correspondências no histórico com score significativo (>= 20)
    if (categoryScores.size > 0) {
      let bestCatId = '';
      let maxScore = 0;

      for (const [catId, score] of categoryScores.entries()) {
        if (score > maxScore) {
          maxScore = score;
          bestCatId = catId;
        }
      }

      if (bestCatId && maxScore >= 20) {
        return bestCatId;
      }
    }
  }

  // =========================================================================
  // ETAPA 2: RECONHECIMENTO INTELIGENTE POR CORRESPONDÊNCIA COM O NOME DAS CATEGORIAS
  // =========================================================================
  const sameTypeCategories = categories.filter(c => c.type === type);
  const targetCategoriesPool = sameTypeCategories.length > 0 ? sameTypeCategories : categories;

  for (const cat of targetCategoriesPool) {
    const normCatName = normalizeText(cat.name);
    if (normCatName.length >= 3) {
      if (normDesc.includes(normCatName) || normCatName.includes(normDesc)) {
        return cat.id;
      }
    }
  }

  // =========================================================================
  // ETAPA 3: RECONHECIMENTO INTELIGENTE POR PALAVRAS-CHAVE E TERMOS DO DICIONÁRIO
  // =========================================================================
  for (const smartRule of SMART_KEYWORDS_MAP) {
    if (smartRule.type && smartRule.type !== type) {
      continue;
    }

    const hasKeyword = smartRule.keywords.some(keyword => {
      const normKw = normalizeText(keyword);
      if (normKw.length <= 3) {
        return descWords.includes(normKw);
      }
      return normDesc.includes(normKw);
    });

    if (hasKeyword) {
      for (const pattern of smartRule.categoryPatterns) {
        const matchedCategory = targetCategoriesPool.find(c =>
          normalizeText(c.name).includes(pattern)
        );
        if (matchedCategory) {
          return matchedCategory.id;
        }
      }
      for (const pattern of smartRule.categoryPatterns) {
        const matchedCategory = categories.find(c =>
          normalizeText(c.name).includes(pattern)
        );
        if (matchedCategory) {
          return matchedCategory.id;
        }
      }
    }
  }

  // =========================================================================
  // ETAPA 4: FALLBACK ADEQUADO AO TIPO
  // =========================================================================
  return getDefaultCategoryForType(type, categories);
}

function getDefaultCategoryForType(type: TransactionType, categories: Category[]): string {
  if (!categories || categories.length === 0) return '';

  const matchingTypeCategories = categories.filter(c => c.type === type);

  if (matchingTypeCategories.length > 0) {
    const genericCategory = matchingTypeCategories.find(c => {
      const n = normalizeText(c.name);
      return n.includes('outro') || n.includes('diverso') || n.includes('geral') || n.includes('despesas gerais') || n.includes('receitas gerais');
    });

    if (genericCategory) {
      return genericCategory.id;
    }

    return matchingTypeCategories[0].id;
  }

  const genericFallback = categories.find(c => {
    const n = normalizeText(c.name);
    return n.includes('outro') || n.includes('diverso') || n.includes('geral');
  });

  return genericFallback ? genericFallback.id : categories[0].id;
}
