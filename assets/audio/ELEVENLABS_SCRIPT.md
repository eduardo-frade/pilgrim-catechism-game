# Script de Áudio — O Peregrino do Catecismo
# Gerar no ElevenLabs como UM arquivo contínuo com 2s de silêncio entre cada linha
# Voz sugerida: "Bella" ou "Charlotte" (warm, friendly) — idioma: Portuguese (Brazil)
# Settings: Stability 55%, Similarity 75%, Style 30%, Speed 0.95

---

## CONFIGURAÇÃO DE VOZ NO ELEVENLABS
- Model: Eleven Multilingual v2
- Language: Portuguese (Brazil)
- Stability: 55
- Similarity Boost: 75
- Style Exaggeration: 30
- Speaker Boost: ON
- Speed: 0.95

---

## SEQUÊNCIA COMPLETA (grave tudo seguido com 2s de pausa entre itens)

[NARRAÇÃO 01 — Quiz intro genérico]
"Atenção, peregrino! Responda a pergunta para continuar sua jornada."

[NARRAÇÃO 02 — Acertou]
"Muito bem! Você acertou! Continue sua jornada!"

[NARRAÇÃO 03 — Errou tentativa 1]
"Hmm, não foi dessa vez. Pense bem e tente de novo!"

[NARRAÇÃO 04 — Errou tentativa 2]
"Quase! Leia a pergunta com atenção e tente de novo!"

[NARRAÇÃO 05 — Errou tentativa 3]
"Não desanime! Deus nos ajuda a aprender. Tente mais uma vez!"

[NARRAÇÃO 06 — Fase completa]
"Parabéns! Você completou a fase! Que Deus abençoe sua jornada!"

[NARRAÇÃO 07 — Game Over]
"Não desista, peregrino! Todo campeão já caiu e se levantou. Tente de novo!"

[NARRAÇÃO 08 — Ganhou vida extra]
"Incrível! Você ganhou uma vida extra! Continue assim!"

[NARRAÇÃO 09 — Pergunta 1]
"Para que você foi criado? O fim principal do homem é glorificar a Deus e desfrutá-Lo para sempre!"

[NARRAÇÃO 10 — Resposta 1]
"A resposta certa é: Glorificar a Deus e desfrutá-Lo para sempre."

[NARRAÇÃO 11 — Pergunta 2]
"Como sabemos o que agrada a Deus? A Bíblia, a Palavra de Deus, nos ensina tudo o que precisamos!"

[NARRAÇÃO 12 — Resposta 2]
"A resposta certa é: A Palavra de Deus, contida nas Escrituras do Velho e do Novo Testamento."

[NARRAÇÃO 13 — Pergunta 3]
"O que é mais importante na Bíblia? Ela nos ensina o que crer sobre Deus e o que Deus nos pede para fazer!"

[NARRAÇÃO 14 — Resposta 3]
"A resposta certa é: O que o homem deve crer acerca de Deus e que obrigação Deus impõe ao homem."

[NARRAÇÃO 15 — Pergunta 4]
"Como é Deus? Deus é um Espírito perfeito e infinito — ele é santo, sábio, poderoso e cheio de amor!"

[NARRAÇÃO 16 — Resposta 4]
"A resposta certa é: Deus é um Espírito infinito, eterno e imutável em seu ser, sabedoria, poder, santidade, justiça, bondade e verdade."

[NARRAÇÃO 17 — Pergunta 5]
"Quantos Deuses existem? Existe apenas um Deus verdadeiro e vivo!"

[NARRAÇÃO 18 — Resposta 5]
"A resposta certa é: Há somente um Deus, vivo e verdadeiro."

[NARRAÇÃO 19 — Pergunta 6]
"Deus é um, mas em três pessoas! O Pai, o Filho e o Espírito Santo — os três são o mesmo Deus."

[NARRAÇÃO 20 — Resposta 6]
"A resposta certa é: Na Divindade há três pessoas: o Pai, o Filho e o Espírito Santo; e estas três são um único Deus."

[NARRAÇÃO 21 — Pergunta 7]
"O que é o plano de Deus? Deus planejou tudo o que acontece desde o começo do mundo!"

[NARRAÇÃO 22 — Resposta 7]
"A resposta certa é: Os decretos de Deus são o seu propósito eterno, pelo qual, para sua própria glória, ele predestinou tudo o que acontece."

[NARRAÇÃO 23 — Pergunta 8]
"Como Deus realiza o seu plano? Deus realiza tudo através da criação e do governo de todas as coisas!"

[NARRAÇÃO 24 — Resposta 8]
"A resposta certa é: Deus executa os seus decretos nas obras da criação e da providência."

---

## COMO USAR DEPOIS DE GERAR

1. Salve o arquivo gerado como: assets/audio/narration_full.mp3
2. Me envie o arquivo e eu corto automaticamente nas marcações [01] a [24]
3. Os arquivos cortados serão: narr_01.mp3, narr_02.mp3 ... narr_24.mp3
4. O código já está preparado para carregá-los e substituir o Web Speech API

---

## NOMES FINAIS DOS ARQUIVOS (para referência)

narr_01.mp3 → quiz_intro
narr_02.mp3 → correct
narr_03.mp3 → wrong_1
narr_04.mp3 → wrong_2
narr_05.mp3 → wrong_3
narr_06.mp3 → phase_complete
narr_07.mp3 → game_over
narr_08.mp3 → extra_life
narr_09.mp3 → q1_text
narr_10.mp3 → q1_answer
narr_11.mp3 → q2_text
narr_12.mp3 → q2_answer
...e assim por diante até narr_24.mp3
