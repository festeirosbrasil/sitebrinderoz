const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.brinderoz.com.br';
const ROOT_DIR = __dirname;

// Função para buscar arquivos HTML recursivamente
function findHtmlFiles(dir, baseDir = dir) {
  let htmlFiles = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Ignora node_modules e outras pastas irrelevantes
      if (file !== 'node_modules' && file !== '.git' && file !== 'assets') {
        htmlFiles = htmlFiles.concat(findHtmlFiles(fullPath, baseDir));
      }
    } else if (file.endsWith('.html')) {
      const relativePath = path.relative(baseDir, fullPath);
      htmlFiles.push(relativePath);
    }
  }

  return htmlFiles;
}

// Função para converter caminho de arquivo em URL
function filePathToUrl(filePath) {
  // Normaliza separadores para /
  let url = filePath.replace(/\\/g, '/');
  
  // index.html na raiz vira apenas /
  if (url === 'index.html') {
    return '/';
  }
  
  // Remove index.html de subpastas (blog/index.html vira blog/)
  url = url.replace(/\/index\.html$/, '/');
  
  // Mantém outros arquivos HTML com extensão
  return '/' + url;
}

// Função para determinar prioridade e frequência
function getPageMetadata(url) {
  if (url === '/') {
    return { priority: '1.0', changefreq: 'weekly' };
  }
  if (url.startsWith('/blog/') && url.endsWith('/')) {
    // Página principal do blog
    return { priority: '0.9', changefreq: 'weekly' };
  }
  if (url.startsWith('/blog/')) {
    // Artigos do blog
    return { priority: '0.8', changefreq: 'monthly' };
  }
  return { priority: '0.7', changefreq: 'monthly' };
}

// Gera o conteúdo do sitemap
function generateSitemap() {
  const htmlFiles = findHtmlFiles(ROOT_DIR);
  const today = new Date().toISOString().split('T')[0];
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Ordena os arquivos para manter homepage no topo
  htmlFiles.sort((a, b) => {
    if (a === 'index.html') return -1;
    if (b === 'index.html') return 1;
    return a.localeCompare(b);
  });

  for (const file of htmlFiles) {
    const url = filePathToUrl(file);
    const { priority, changefreq } = getPageMetadata(url);
    
    sitemap += '  <url>\n';
    sitemap += `    <loc>${BASE_URL}${url}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += `    <changefreq>${changefreq}</changefreq>\n`;
    sitemap += `    <priority>${priority}</priority>\n`;
    sitemap += '  </url>\n';
  }

  sitemap += '</urlset>';
  
  return sitemap;
}

// Salva o sitemap
function saveSitemap() {
  try {
    const sitemapContent = generateSitemap();
    const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
    
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
    
    console.log('✓ Sitemap gerado com sucesso!');
    console.log(`  Arquivo: ${sitemapPath}`);
    console.log(`  URLs incluídas: ${(sitemapContent.match(/<url>/g) || []).length}`);
  } catch (error) {
    console.error('✗ Erro ao gerar sitemap:', error.message);
    process.exit(1);
  }
}

// Executa
saveSitemap();
