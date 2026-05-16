const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventario')
        .setDescription('Mostra os teus equipamentos e nível de forja'),

    async execute(interaction) {
        const userId = interaction.user.id;

        const perfil = await db.get(`perfil_${userId}`) || { nivel: 0, xp: 0 };
        const inv = await db.get(`inventario_${userId}`) || {};
        const mats = await db.get(`materiais_${userId}`) || { ferro: 0, madeira: 0, escama: 0, essencia: 0, ouro: 0 };

        const xpMaximo = 100 + (perfil.nivel * 50);

        // Formatação da lista de equipamentos
        let listaItens = Object.entries(inv)
            .map(([id, qtd]) => {
                // Deixar a primeira letra maiúscula e remover underlines para ficar bonito
                const nomeFormatado = id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return `• **${nomeFormatado}**: \`${qtd}x\``;
            })
            .join('\n') || "Nenhum equipamento forjado.";

        // Formatação da lista de materiais
        let listaMats = Object.entries(mats)
            .map(([id, qtd]) => `• ${id.charAt(0).toUpperCase() + id.slice(1)}: \`${qtd}\``)
            .join('\n');

        const invEmbed = new EmbedBuilder()
            .setTitle(`🎒 Mochila de ${interaction.user.username}`)
            .setColor("Blue")
            .setThumbnail(interaction.user.displayAvatarURL())
            .addFields(
                { 
                    name: '📊 Status de Forja', 
                    value: `**Nível:** \`${perfil.nivel}\`\n**XP:** \`${perfil.xp} / ${xpMaximo}\``, 
                    inline: false 
                },
                { 
                    name: '⚔️ Equipamentos', 
                    value: listaItens, 
                    inline: true 
                },
                { 
                    name: '📦 Materiais', 
                    value: listaMats, 
                    inline: true 
                }
            )
            .setFooter({ text: "Use /minerar para conseguir mais materiais!" })
            .setTimestamp();

        await interaction.reply({ embeds: [invEmbed] });
    }
};
