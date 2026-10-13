import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, ArrowRight, Sparkles, X, Footprints } from 'lucide-react';
import { Button } from '@/components/ui/button';
import sneaker from '@/assets/tenis-feminino.asset.json';
import heels from '@/assets/saltos.jpg';
import flats from '@/assets/sapatilhas.jpg';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Entre Passos — Curiosidades sobre sapatos femininos' },
    { name: 'description', content: 'Histórias, curiosidades e cuidados sobre sapatos femininos. Descubra o universo dos saltos, tênis e sapatilhas.' },
    { property: 'og:title', content: 'Entre Passos — Cada sapato tem uma história' },
    { property: 'og:description', content: 'Um olhar curioso sobre a história, o estilo e o conforto dos sapatos femininos.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});
const stories = [
  { id: 1, category: 'História', image: heels, title: 'O salto alto nem sempre foi feminino', description: 'Antes de conquistar a moda feminina, os saltos já faziam parte do guarda-roupa masculino.', time: '3 min', body: 'Muito antes de se tornarem um símbolo da moda feminina, os saltos eram usados por cavaleiros persas: ajudavam a manter os pés nos estribos. Na Europa dos séculos XVII e XVIII, também se tornaram um sinal de prestígio entre homens da aristocracia. Luís XIV, rei da França, ficou conhecido por seus sapatos com saltos vermelhos. Com o passar do tempo, seu uso e significado mudaram — uma boa lembrança de que a moda nunca fica parada.' },
  { id: 2, category: 'Estilo', image: sneaker.url, title: 'Tênis branco: de esportivo a clássico', description: 'Como um calçado das quadras ganhou espaço em tantos estilos e ocasiões.', time: '4 min', body: 'A combinação de solados de borracha e cabedais leves abriu caminho para os tênis modernos. Durante o século XX, o calçado esportivo ultrapassou as quadras e se aproximou da cultura urbana e da moda. O tênis branco ganhou destaque pela versatilidade: pode acompanhar jeans, vestidos e peças de alfaiataria. Mais do que uma regra de estilo, a escolha depende da ocasião e do que faz você se sentir bem.' },
  { id: 3, category: 'Conforto', image: flats, title: 'Sapatilhas: um passo além do balé', description: 'A inspiração nos palcos que se tornou uma companhia para o dia a dia.', time: '3 min', body: 'As sapatilhas da moda têm uma conexão visual com os calçados do balé: perfil baixo, linhas delicadas e, muitas vezes, um pequeno laço. Sua popularidade cresceu no século XX, com a presença no cinema e no guarda-roupa de ícones de estilo. Mas sola baixa não é sinônimo automático de conforto. O ajuste, o material e a sustentação também importam. Experimente caminhar com o par e observe se há pressão nos dedos ou atrito no calcanhar.' },
  { id: 4, category: 'Cuidados', image: sneaker.url, title: 'Como cuidar do seu tênis branco', description: 'Pequenos hábitos que ajudam a manter seu par favorito bonito por mais tempo.', time: '2 min', body: 'Comece pelas orientações do fabricante, porque couro, tecido e materiais sintéticos exigem cuidados diferentes. Remova a sujeira superficial com uma escova macia e, quando permitido, use um pano levemente umedecido e sabão neutro. Evite produtos agressivos e deixe secar naturalmente em local ventilado, longe do calor direto. Guardar os sapatos secos e alternar os pares também ajuda na conservação.' },
];
const categories = ['Todas', 'História', 'Estilo', 'Conforto', 'Cuidados'];
function Index() {
  const [category, setCategory] = useState('Todas');
  const [article, setArticle] = useState<(typeof stories)[number] | null>(null);
  useEffect(() => {
    if (!article) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setArticle(null); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [article]);
  const explore = (value = 'Todas') => { setCategory(value); document.getElementById('curiosidades')?.scrollIntoView({ behavior: 'smooth' }); };
  return <>
    <header className="site-header page-width">
      <a href="/" aria-label="Entre Passos, início" className="brand">entre passos<em>.</em></a>
      <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
        <Button variant="link" className="nav-link nav-active p-0" onClick={() => explore()}>Curiosidades</Button>
        <Button variant="ghost" className="nav-link p-0" onClick={() => explore('História')}>História & estilo</Button>
        <Button variant="ghost" className="nav-link p-0" onClick={() => explore('Cuidados')}>Cuidados</Button>
      </nav>
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Footprints size={17} /><span className="hidden sm:inline">Um universo a cada passo</span></div>
    </header>
    <main>
      <section className="hero page-width">
        <img className="hero-photo" src={sneaker.url} alt="Tênis feminino branco com cadarços e detalhe dourado" width={804} height={768} fetchPriority="high" />
        <div className="hero-copy">
          <div className="eyebrow flex items-center gap-2 text-primary"><span className="h-px w-6 bg-primary" /> MODA, HISTÓRIA & DESCOBERTAS</div>
          <h1>Sapatos femininos.<br />Histórias que<br /><em>vão além.</em></h1>
          <p className="mb-7 max-w-80 text-sm leading-7 text-muted-foreground">Muito mais que um par de sapatos. Descubra curiosidades, inspirações e detalhes que tornam cada passo único.</p>
          <Button className="editorial-button" onClick={() => explore()}>Explore as curiosidades <ArrowDown size={15} /></Button>
          <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground"><Sparkles size={13} /> Para quem ama descobrir os detalhes.</div>
        </div>
        <span className="hero-caption">O clássico que acompanha novos caminhos.</span>
      </section>
      <aside className="fact-band"><div className="page-width fact-inner"><span className="fact-symbol">✳</span><div className="shrink-0"><p className="eyebrow text-primary">VOCÊ SABIA?</p></div><p className="text-sm leading-6">O salto alto já foi um símbolo de poder <strong className="font-medium">no guarda-roupa masculino.</strong> A moda tem muito a contar.</p><Button variant="ghost" size="icon" className="ml-auto shrink-0" aria-label="Ler a história do salto alto" onClick={() => setArticle(stories[0] ?? null)}><ArrowUpRight /></Button></div></aside>
      <section id="curiosidades" className="stories page-width scroll-mt-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow mb-3 text-muted-foreground">UM OLHAR MAIS CURIOSO</p><h2 className="section-title">Cada sapato, uma descoberta.</h2></div><span className="text-xs text-muted-foreground">Histórias para levar com você <ArrowDown className="ml-2 inline" size={13} /></span></div>
        <div className="mb-8 flex flex-wrap gap-2" aria-label="Categorias">{categories.map(value => <Button key={value} variant={category === value ? 'default' : 'ghost'} className="filter-button" aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</Button>)}</div>
        <div className="grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{stories.filter(s => category === 'Todas' ? s.id !== 4 : s.category === category).map(story => <article key={story.id}>
          <a href={`#historia-${story.id}`} onClick={event => { event.preventDefault(); setArticle(story); }} aria-label={`Ler: ${story.title}`}><img src={story.image} alt={story.id === 1 ? 'Sapatos de salto baixo em vermelho cereja' : story.id === 3 ? 'Sapatilhas pretas com laços' : 'Tênis feminino branco'} width={1024} height={768} loading="lazy" className={`story-image ${story.id === 2 || story.id === 4 ? 'sneaker' : ''}`} /></a>
          <div className="mt-5 flex items-center justify-between"><span className="story-category">{story.category}</span><span className="text-[10px] text-muted-foreground">{story.time} de leitura</span></div>
          <h3 className="story-title mt-3 mb-3">{story.title}</h3><p className="text-xs leading-6 text-muted-foreground">{story.description}</p><Button variant="link" className="mt-3 h-auto p-0 text-xs" onClick={() => setArticle(story)}>Ler curiosidade <ArrowRight size={14} /></Button>
        </article>)}</div>
      </section>
    </main>
    <footer className="footer"><div className="page-width flex flex-wrap items-center justify-between gap-5"><a href="/" className="brand text-xl">entre passos<em>.</em></a><p className="text-xs text-muted-foreground">Um espaço para histórias, estilo e bons passos.</p><span className="text-[10px] text-muted-foreground">© 2026 Entre Passos</span></div></footer>
    {article && <div className="article-overlay" onClick={() => setArticle(null)}><section role="dialog" aria-modal="true" aria-labelledby="article-title" className="article-dialog" onClick={e => e.stopPropagation()}><Button autoFocus variant="secondary" size="icon" className="absolute right-4 top-4" aria-label="Fechar leitura" onClick={() => setArticle(null)}><X /></Button><img src={article.image} alt="" width={1024} height={768} className="story-image mb-6" /><span className="story-category">{article.category} · {article.time} de leitura</span><h2 id="article-title" className="section-title my-4">{article.title}</h2><p className="text-sm leading-8 text-muted-foreground">{article.body}</p><Button variant="outline" className="mt-6" onClick={() => setArticle(null)}>Voltar às curiosidades <ArrowRight /></Button></section></div>}
  </>;
}
