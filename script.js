// ============================================================
//  AURORA COMERCIAL - SCRIPT PRINCIPAL
//  (unificado com localStorage do admin)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const NUMERO_WHATSAPP = '244925328181';
    let carrinho = [];
    let catalogo = [];
    let todosProdutos = [];

    // ===== ELEMENTOS DOM =====
    const grade = document.getElementById('gradeProdutos');
    const maisCompradosGrid = document.getElementById('maisCompradosGrid');
    const inputBusca = document.getElementById('campoBusca');
    const linksCategorias = document.querySelectorAll('.menu-categorias a[data-categoria]');
    const filtrosRapidos = document.querySelectorAll('.filtro-rapido');
    const sidebar = document.getElementById('carrinhoSidebar');
    const overlay = document.getElementById('carrinhoOverlay');
    const abrirCarrinhoBtn = document.getElementById('abrirCarrinhoFlutuante');
    const fecharCarrinhoBtn = document.getElementById('btnFecharCarrinho');
    const listaProdutosHTML = document.getElementById('itensCarrinhoLoja');
    const totalHTML = document.getElementById('totalCarrinhoLoja');
    const badgeContador = document.getElementById('badgeContador');
    const toast = document.getElementById('toast-notificacao');
    const carregandoEl = document.getElementById('carregandoProdutos');

    const idsMaisComprados = [1, 13, 17, 21, 23, 25, 7, 11];

    // ===== TOAST =====
    function mostrarToast(mensagem = 'Adicionado ao carrinho!') {
        toast.textContent = mensagem;
        toast.style.top = '20px';
        setTimeout(() => { toast.style.top = '-100px'; }, 2200);
    }

    // ===== CARREGAMENTO DE PRODUTOS (prioriza localStorage) =====
    function carregarProdutos(callback) {
        // 1º tentar localStorage (dados do admin)
        let dadosLocal = localStorage.getItem('aurora_produtos_admin');
        if (dadosLocal) {
            try {
                const parsed = JSON.parse(dadosLocal);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    catalogo = parsed;
                    todosProdutos = [...catalogo];
                    if (callback) callback();
                    return;
                }
            } catch (e) { /* fallback */ }
        }

        // 2º fallback: produtos.json
        fetch('produtos.json')
            .then(res => {
                if (!res.ok) throw new Error('Erro ao carregar JSON');
                return res.json();
            })
            .then(dados => {
                catalogo = dados;
                todosProdutos = [...catalogo];
                localStorage.setItem('aurora_produtos_admin', JSON.stringify(catalogo));
                if (callback) callback();
            })
            .catch(err => {
                console.warn('Erro ao carregar produtos:', err);
                catalogo = [];
                todosProdutos = [];
                if (callback) callback();
            });
    }

    // ===== ORDENAÇÃO POR ORDEM =====
    function ordenarPorOrdem(produtos) {
        return produtos.sort((a, b) => (a.ordem || a.id) - (b.ordem || b.id));
    }

    // ===== RENDERIZAÇÃO DE PRODUTOS =====
    function renderizarProdutos(filtroCategoria = 'todos', termoBusca = '') {
        if (!grade) return;
        grade.innerHTML = '';

        let produtosFiltrados = catalogo.filter(prod => {
            const matchCategoria = filtroCategoria === 'todos' || prod.categoria === filtroCategoria;
            const matchBusca = !termoBusca ||
                prod.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
                prod.tag.toLowerCase().includes(termoBusca.toLowerCase()) ||
                prod.categoria.toLowerCase().includes(termoBusca.toLowerCase());
            return matchCategoria && matchBusca;
        });

        ordenarPorOrdem(produtosFiltrados);

        if (produtosFiltrados.length === 0) {
            grade.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#999; font-size:16px;">Nenhum produto encontrado para esta categoria ou busca.</p>`;
            return;
        }

        produtosFiltrados.forEach(prod => {
            const card = criarCardProduto(prod);
            grade.appendChild(card);
        });
    }

    // ===== RENDERIZAR MAIS COMPRADOS =====
    function renderizarMaisComprados() {
        if (!maisCompradosGrid) return;
        maisCompradosGrid.innerHTML = '';
        const produtos = catalogo.filter(p => idsMaisComprados.includes(p.id));
        ordenarPorOrdem(produtos);
        produtos.forEach(prod => {
            const card = criarCardProduto(prod);
            maisCompradosGrid.appendChild(card);
        });
    }

    // ===== CRIAR CARD DE PRODUTO =====
    function criarCardProduto(prod) {
        const card = document.createElement('a');
        card.className = 'produto-card';
        card.href = `detalhe.html?id=${prod.id}`;
        card.style.textDecoration = 'none';
        card.style.color = 'inherit';

        let html = `
            <div class="produto-imagem">
                <img src="${prod.imagens[0] || 'placeholder.jpg'}" alt="${prod.nome}" loading="lazy" onerror="this.src='placeholder.jpg'">
            </div>
            <div class="produto-info">
                <span class="categoria-tag">${prod.tag || prod.categoria}</span>
                <h3>${prod.nome}</h3>
        `;

        if (prod.precoAntigo) {
            html += `<p class="preco"><span class="desconto">${prod.desconto || ''}</span> ${prod.preco}</p>`;
            html += `<span style="text-decoration:line-through;color:#999;font-size:14px;">${prod.precoAntigo}</span>`;
        } else {
            html += `<p class="preco">${prod.preco}</p>`;
        }

        if (prod.parcelas) {
            html += `<p class="parcelas">${prod.parcelas}</p>`;
        }
        if (prod.freteGratis) {
            html += `<span class="selo-frete"><strong>Frete grátis</strong> FULL</span>`;
        }

        html += `</div>`;
        card.innerHTML = html;
        return card;
    }

    // ===== APLICAR FILTROS =====
    function aplicarFiltros() {
        const termo = inputBusca.value.trim();
        const categoriaAtiva = document.querySelector('.menu-categorias a.ativo')?.dataset.categoria || 'todos';
        renderizarProdutos(categoriaAtiva, termo);

        filtrosRapidos.forEach(el => {
            el.classList.toggle('ativo', el.dataset.categoria === categoriaAtiva);
        });
    }

    // ===== EVENTOS DOS FILTROS =====
    linksCategorias.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            linksCategorias.forEach(l => l.classList.remove('ativo'));
            link.classList.add('ativo');
            aplicarFiltros();
        });
    });

    filtrosRapidos.forEach(el => {
        el.addEventListener('click', () => {
            const cat = el.dataset.categoria;
            const link = document.querySelector(`.menu-categorias a[data-categoria="${cat}"]`);
            if (link) link.click();
        });
    });

    // Busca com debounce
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }
    inputBusca.addEventListener('input', debounce(aplicarFiltros, 300));

    // Função global para filtro via rodapé
    window.filtrarPorCategoria = function(categoria) {
        const link = document.querySelector(`.menu-categorias a[data-categoria="${categoria}"]`);
        if (link) link.click();
        else {
            document.querySelector('.menu-categorias a[data-categoria="todos"]')?.click();
            renderizarProdutos(categoria, inputBusca.value.trim());
        }
        document.getElementById('conteudo-principal').scrollIntoView({ behavior: 'smooth' });
    };

    // ===== DROPDOWN MOBILE =====
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(drop => {
        const toggle = drop.querySelector('.dropdown-toggle');
        const submenu = drop.querySelector('.submenu');
        if (toggle && submenu) {
            toggle.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    submenu.classList.toggle('aberto');
                }
            });
            submenu.querySelectorAll('a').forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        submenu.classList.remove('aberto');
                    }
                });
            });
        }
    });
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const isDropdown = e.target.closest('.dropdown');
            if (!isDropdown) {
                document.querySelectorAll('.submenu.aberto').forEach(sub => sub.classList.remove('aberto'));
            }
        }
    });

    // ===== CARROSSEL =====
    let slideAtual = 0;
    const slides = document.querySelectorAll('.slide');
    const indicadores = document.querySelectorAll('.indicador');
    let intervaloCarrossel;

    function mostrarSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        slideAtual = index;
        const offset = -index * 100;
        const container = document.querySelector('.carrossel-slides');
        if (container) container.style.transform = `translateX(${offset}%)`;
        indicadores.forEach((ind, i) => {
            ind.classList.toggle('ativo', i === index);
        });
    }

    window.mudarSlide = function(direcao) {
        mostrarSlide(slideAtual + direcao);
        reiniciarIntervalo();
    };

    function reiniciarIntervalo() {
        clearInterval(intervaloCarrossel);
        if (slides.length > 1) {
            intervaloCarrossel = setInterval(() => {
                mostrarSlide(slideAtual + 1);
            }, 5000);
        }
    }

    if (slides.length > 0) {
        mostrarSlide(0);
        reiniciarIntervalo();
        indicadores.forEach((ind, i) => {
            ind.addEventListener('click', () => {
                mostrarSlide(i);
                reiniciarIntervalo();
            });
        });
        const container = document.querySelector('.carrossel-container');
        if (container) {
            container.addEventListener('mouseenter', () => clearInterval(intervaloCarrossel));
            container.addEventListener('mouseleave', reiniciarIntervalo);
        }
    }

    // ===== CARRINHO =====
    function salvarCarrinho() {
        localStorage.setItem('carrinho_aurora', JSON.stringify(carrinho));
        atualizarBadge();
    }

    function carregarCarrinho() {
        const dados = localStorage.getItem('carrinho_aurora');
        carrinho = dados ? JSON.parse(dados) : [];
        atualizarCarrinho();
    }

    function extrairValorNumerico(precoString) {
        if (!precoString) return 0;
        const numeros = precoString.replace(/[^0-9,]/g, '').replace(',', '.');
        return parseFloat(numeros) || 0;
    }

    function atualizarCarrinho() {
        if (!listaProdutosHTML) return;
        listaProdutosHTML.innerHTML = '';
        let totalGeral = 0;
        let totalItens = 0;

        if (carrinho.length === 0) {
            listaProdutosHTML.innerHTML = `<li style="text-align:center;color:#999;margin-top:40px;font-size:15px;">Sua sacola está vazia.</li>`;
        } else {
            carrinho.forEach((item, index) => {
                const valorLimpo = extrairValorNumerico(item.preco);
                totalGeral += valorLimpo * item.quantidade;
                totalItens += item.quantidade;
                const li = document.createElement('li');
                li.className = 'item-carrinho-loja';
                li.innerHTML = `
                    <div class="item-info-loja">
                        <h4>${item.nome}</h4>
                        <p>${item.preco}</p>
                    </div>
                    <div class="item-controles">
                        <button onclick="alterarQtd(${index}, -1)">−</button>
                        <span>${item.quantidade}</span>
                        <button onclick="alterarQtd(${index}, 1)">+</button>
                    </div>
                `;
                listaProdutosHTML.appendChild(li);
            });
        }

        if (totalHTML) {
            totalHTML.textContent = totalGeral.toLocaleString('pt-AO');
        }
        atualizarBadge();
        salvarCarrinho();
    }

    function atualizarBadge() {
        const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
        if (badgeContador) {
            badgeContador.textContent = totalItens;
            badgeContador.style.display = totalItens > 0 ? 'inline' : 'none';
        }
    }

    window.alterarQtd = function(index, mudanca) {
        if (!carrinho[index]) return;
        carrinho[index].quantidade += mudanca;
        if (carrinho[index].quantidade <= 0) {
            carrinho.splice(index, 1);
        }
        atualizarCarrinho();
    };

    function adicionarProdutoCarrinho(nome, preco) {
        const existente = carrinho.find(i => i.nome === nome);
        if (existente) {
            existente.quantidade += 1;
        } else {
            carrinho.push({ nome, preco, quantidade: 1 });
        }
        atualizarCarrinho();
        mostrarToast('Produto adicionado!');
    }

    // ===== ABRIR/FECHAR CARRINHO =====
    function abrirCarrinho() {
        sidebar.classList.add('ativo');
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    function fecharCarrinho() {
        sidebar.classList.remove('ativo');
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }

    if (abrirCarrinhoBtn) abrirCarrinhoBtn.addEventListener('click', abrirCarrinho);
    if (fecharCarrinhoBtn) fecharCarrinhoBtn.addEventListener('click', fecharCarrinho);
    if (overlay) overlay.addEventListener('click', fecharCarrinho);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (sidebar && sidebar.classList.contains('ativo')) fecharCarrinho();
        }
    });

    // ===== BALANÇO DE VENDAS =====
    function renderizarBalancoSemanal() {
        const historico = JSON.parse(localStorage.getItem('aurora_historico_vendas')) || [];
        const corpoTabela = document.getElementById('corpoTabelaHistorico');
        const faturamentoTotalHTML = document.getElementById('faturamentoTotal');
        const qtdPedidosTotalHTML = document.getElementById('qtdPedidosTotal');
        const itensVendidosTotalHTML = document.getElementById('itensVendidosTotal');

        if (corpoTabela) {
            corpoTabela.innerHTML = '';
            let faturamentoAcumulado = 0;
            let totalItensVendidos = 0;

            if (historico.length === 0) {
                corpoTabela.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#999; padding:20px;">Nenhuma venda registada esta semana.</td></tr>`;
            } else {
                historico.forEach(venda => {
                    faturamentoAcumulado += venda.valorTotal || 0;
                    totalItensVendidos += venda.totalItens || 0;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${venda.dataHora || ''}</strong></td>
                        <td>${venda.produtosResumo || ''}</td>
                        <td style="color:#25D366; font-weight:bold;">${(venda.valorTotal || 0).toLocaleString('pt-AO')} Kz</td>
                    `;
                    corpoTabela.appendChild(tr);
                });
            }
            if (faturamentoTotalHTML) faturamentoTotalHTML.textContent = faturamentoAcumulado.toLocaleString('pt-AO');
            if (qtdPedidosTotalHTML) qtdPedidosTotalHTML.textContent = historico.length;
            if (itensVendidosTotalHTML) itensVendidosTotalHTML.textContent = totalItensVendidos;
        }
    }

    function salvarVendaNoHistorico() {
        const historico = JSON.parse(localStorage.getItem('aurora_historico_vendas')) || [];
        let produtosResumo = carrinho.map(item => `${item.nome} (x${item.quantidade})`).join(', ');
        let valorTotalPedido = carrinho.reduce((acc, item) => acc + (extrairValorNumerico(item.preco) * item.quantidade), 0);
        let totalItensPedido = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
        const agora = new Date();
        const dataHoraFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        historico.push({
            dataHora: dataHoraFormatada,
            produtosResumo: produtosResumo,
            valorTotal: valorTotalPedido,
            totalItens: totalItensPedido
        });
        localStorage.setItem('aurora_historico_vendas', JSON.stringify(historico));
        renderizarBalancoSemanal();
    }

    const btnLimparHistorico = document.getElementById('btnLimparHistorico');
    if (btnLimparHistorico) {
        btnLimparHistorico.addEventListener('click', () => {
            if (confirm('Deseja zerar o balanço e limpar o histórico de vendas da semana?')) {
                localStorage.removeItem('aurora_historico_vendas');
                renderizarBalancoSemanal();
                mostrarToast('Histórico limpo!');
            }
        });
    }

    // ===== FINALIZAR PEDIDO (WhatsApp) =====
    const btnFinalizar = document.getElementById('btnFinalizarWhatsApp');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', () => {
            if (carrinho.length === 0) {
                alert('Seu carrinho está vazio.');
                return;
            }
            salvarVendaNoHistorico();

            let texto = `*AURORARTE COMERCIAL - NOVO PEDIDO*\n=============================\n\n`;
            carrinho.forEach(item => {
                texto += `• *${item.nome}* (x${item.quantidade}) - ${item.preco}\n`;
            });
            const total = carrinho.reduce((acc, item) => acc + extrairValorNumerico(item.preco) * item.quantidade, 0);
            texto += `\n*Total Estimado:* KZ ${total.toLocaleString('pt-AO')},00\n\nOlá! Gostaria de finalizar o meu pedido com os produtos selecionados.`;

            window.open(`https://api.whatsapp.com/send?phone=${NUMERO_WHATSAPP}&text=${encodeURIComponent(texto)}`, '_blank');

            carrinho = [];
            atualizarCarrinho();
            fecharCarrinho();
            mostrarToast('Pedido enviado com sucesso!');
        });
    }

    // ===== INICIALIZAÇÃO =====
    carregarProdutos(() => {
        renderizarProdutos('todos', '');
        renderizarMaisComprados();
        carregarCarrinho();
        renderizarBalancoSemanal();

        if (carregandoEl) carregandoEl.style.display = 'none';
    });

    // ===== EXPOR FUNÇÃO PARA DETALHE =====
    window.adicionarAoCarrinho = adicionarProdutoCarrinho;
});