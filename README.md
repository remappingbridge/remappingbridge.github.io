# RemappingBridge — Simulador web

**WEB-01 — candidato para validação do operador.** Este repositório hospeda a aplicação web estática do projeto [RemappingBridge](https://github.com/remappingbridge/remappingbridge). A fonte de UX é o firmware **v3.2.3** (`f38c5fd15c68ea9a36d3b05912727788d7b98e81`) e a referência de simulação atual é o [mouse-ui](https://github.com/remappingbridge/mouse-ui), não o simulador histórico v1.

## Estado atual

- **Implementado em WEB-01:** `index.html` único, recursos CSS/JS locais, shell de visualização do LCD, controles HAT com nove botões clicáveis, feedback visual/contagem de ações, reset de contagem, layout responsivo e testes locais no browser.
- **Prévia, ainda não implementado:** renderer exato do LCD RGB565 240×240 (WEB-02), navegação HAT/Help/Lock (WEB-03), 45 telas/fluxos (WEB-04), BLE simulado/persistência (WEB-05), Movement/Custom (WEB-06), Modifier/Shortcuts (WEB-07), brilho 0–100% e polimento final (WEB-08), cenários/evidências (WEB-09) e release de Pages validada (WEB-10).
- **Fonte do LCD desta etapa:** texto fixo da tela `BLU2USB_SCREEN_SEARCHING_FIRST` do firmware v3.2.3, apresentado em HTML **não pixel-perfect**; não confundir com a renderização por bitmap/Canvas planejada.
- Os controles **não executam transições do firmware** nesta etapa: apenas registram a entrada de demonstração.
- Nenhuma conexão Bluetooth, HID USB, gravação flash, UF2, API ou telemetria.

## Executar sem instalar nada

Abrir `index.html` diretamente pelo navegador (`file://`) funciona com os assets relativos.

Alternativamente, para experimentar em HTTP local:

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000/` e testar os nove botões do HAT. O número de eventos deve aumentar, e o botão **Limpar** deve restaurá-lo para `00`.

Para validar sem Node.js ou GitHub Actions do projeto, abrir `tests/index.html` (`file://` ou `http://localhost:8000/tests/`) e conferir todas as verificações. **Executar o harness no navegador e registrar seu resultado**, pois somente a existência do arquivo não prova testes executados.

## Arquivos

```text
index.html            única página de aplicação
.nojekyll             desativa processamento Jekyll nos arquivos estáticos
assets/css/app.css    CSS local responsivo e controles arredondados
assets/js/app.js      bootstrap e feedback do HAT (sem lógica BLE/UX)
tests/index.html      harness de testes browser-only
tests/runner.js       casos de teste independentes de build
README.md             documentação do repositório
LICENSE               licença GNU AGPLv3 existente (preservada)
```

Não existe `package.json`, `node_modules`, backend, biblioteca CDN necessária nem workflow autoral de Actions.

## GitHub Pages

A URL pretendida depois da habilitação por **Settings → Pages → Deploy from a branch → main / (root)** é [remappingbridge.github.io](https://remappingbridge.github.io/). **A publicação não foi verificada no WEB-01:** este gate fica em branch/PR candidata até o aceite. O GitHub pode usar mecanismos internos de publicação Pages; não é um workflow de build mantido aqui.

## Planejamento e critérios de aceite

[Programa WEB-00..WEB-15](https://github.com/remappingbridge/planner/tree/main/web-simulator-readme) e [gate WEB-01](https://github.com/remappingbridge/planner/blob/main/web-simulator-readme/gates/WEB-01.md).

O futuro README do firmware mostrará uma prévia estática clicável para abrir esta aplicação no navegador. O GitHub **não executa JavaScript incorporado diretamente em README.md**.

## Licença

Preservada a GNU AGPLv3 deste repositório. O firmware é licenciado em CC0 e a tela textual de prévia é baseada em seus fontes; não inclui imagens nem CDNs externos.
