const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minerar')
        .setDescription('Explore cavernas em busca de minérios'),

    async execute(interaction) {
        const userId = interaction.user.id;
        
        // Inventário temporário da expedição
        let mochilaExpedicao = { ferro: 0, escama: 0, ouro: 0 };
        let profundidade = 0;
        let encerrado = false;

        const gerarEmbed = (msg, cor = "Blue") => {
            return new EmbedBuilder()
                .setTitle("⛏️ Exploração de Caverna")
                .setDescription(msg)
                .addFields(
                    { name: "📍 Profundidade", value: `${profundidade} metros`, inline: true },
                    { name: "🎒 Coletado nesta busca", value: `Ferro: ${mochilaExpedicao.ferro} | Ouro: ${mochilaExpedicao.ouro} | Escamas: ${mochilaExpedicao.escama}`, inline: false }
                )
                .setColor(cor)
                .setFooter({ text: "Cuidado: quanto mais fundo, maior o risco de desmoronamento!" });
        };

        const botoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('explorar').setLabel('Explorar mais fundo').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('sair').setLabel('Sair com os itens').setStyle(ButtonStyle.Success)
        );

        const response = await interaction.reply({
            embeds: [gerarEmbed("Você acendeu sua tocha e entrou na caverna. O que deseja fazer?")],
            components: [botoes]
        });

        // Coletor de cliques nos botões (dura 5 minutos)
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: "Essa caverna não é sua!", ephemeral: true });

            if (i.customId === 'sair') {
                encerrado = true;
                // Salvar itens no banco de dados permanentemente
                let materiaisAtuais = await db.get(`materiais_${userId}`) || { ferro: 0, madeira: 0, escama: 0, essencia: 0, ouro: 0 };
                
                materiaisAtuais.ferro += mochilaExpedicao.ferro;
                materiaisAtuais.escama += mochilaExpedicao.escama;
                materiaisAtuais.ouro += mochilaExpedicao.ouro;

                await db.set(`materiais_${userId}`, materiaisAtuais);
                
                await i.update({
                    embeds: [gerarEmbed("✅ Você saiu em segurança da caverna e guardou seus minérios no baú!", "Green")],
                    components: []
                });
                return collector.stop();
            }

            if (i.customId === 'explorar') {
                profundidade += Math.floor(Math.random() * 10) + 5;
                const sorte = Math.random();

                let evento = "";
                if (sorte < 0.15) { // 15% de chance de desmoronamento
                    encerrado = true;
                    await i.update({
                        embeds: [gerarEmbed("⚠️ **DESMORONAMENTO!** A caverna desabou e você correu para fora, mas deixou cair todos os minérios coletados!", "Red")],
                        components: []
                    });
                    return collector.stop();
                } else if (sorte < 0.60) { // Encontrou minérios
                    const qtd = Math.floor(Math.random() * 3) + 1;
                    mochilaExpedicao.ferro += qtd;
                    if (profundidade > 30) mochilaExpedicao.ouro += 1;
                    evento = `⛏️ Você encontrou **${qtd}x Ferro** encravado nas rochas!`;
                } else if (sorte < 0.80) { // Encontrou criatura (escama)
                    mochilaExpedicao.escama += 1;
                    evento = "🐉 Você encontrou restos de um dragão de caverna e pegou **1x Escama**!";
                } else {
                    evento = "🔦 Você caminhou pelos túneis escuros, mas não encontrou nada interessante aqui.";
                }

                await i.update({
                    embeds: [gerarEmbed(evento)],
                    components: [botoes]
                });
            }
        });

        collector.on('end', () => {
            if (!encerrado) {
                interaction.editReply({ components: [] });
            }
        });
    }
};
