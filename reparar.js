const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

const { equipamentos } = require('./forjar.js'); 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reparar')
        .setDescription('Conserta um equipamento danificado')
        .addStringOption(opt => opt.setName('item')
            .setDescription('Qual item deseja reparar?')
            .setRequired(true)
            .setAutocomplete(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const userId = interaction.user.id;
        
        const inv = await db.get(`inventario_${userId}`) || {};
        
        const escolhas = Object.keys(inv).filter(key => {
            return key.startsWith('danificado_') && 
                   equipamentos[key] && 
                   equipamentos[key].nome.toLowerCase().includes(focusedValue);
        });

        await interaction.respond(
            escolhas.slice(0, 25).map(key => ({
                name: `${equipamentos[key].nome} (Possui: ${inv[key]})`,
                value: key
            }))
        ).catch(err => console.error("Erro no respond do autocomplete:", err));
    },

    async execute(interaction) {
        const userId = interaction.user.id;
        const itemKey = interaction.options.getString('item');
        const itemData = equipamentos[itemKey];

        // Validação básica
        if (!itemData || !itemData.reparo) {
            return interaction.reply({ content: "Este item não é válido para reparo!", flags: [64] });
        }

        const itemOriginal = equipamentos[itemData.itemOriginal];
        if (!itemOriginal) return interaction.reply({ content: "Erro: Item original não encontrado.", flags: [64] });

        let inv = await db.get(`inventario_${userId}`) || {};
        let mats = await db.get(`materiais_${userId}`) || {};
        let perfil = await db.get(`perfil_${userId}`) || { nivel: 0, xp: 0 };

        // Verifica se tem o item no inventário
        if (!inv[itemKey] || inv[itemKey] <= 0) {
            return interaction.reply({ content: "Você não possui esse item danificado!", flags: [64] });
        }

        // Verificar materiais
        for (const [mat, qtd] of Object.entries(itemData.reparo)) {
            if (!mats[mat] || mats[mat] < qtd) {
                return interaction.reply({ content: `Faltam materiais! Você precisa de ${qtd}x ${mat}.`, flags: [64] });
            }
        }

        // Iniciar reparo
        const tempoReparo = (itemOriginal.tempo || 60000) / 2;
        const xpGanho = Math.floor((itemOriginal.xp || 30) / 3);

        await interaction.reply({ content: `⚒️ Reparando sua **${itemOriginal.nome}**... Aguarde ${tempoReparo / 1000}s.` });

        setTimeout(async () => {
            // Recarregar dados para evitar duplicagem (Race Condition)
            let invAtual = await db.get(`inventario_${userId}`) || {};
            let matsAtuais = await db.get(`materiais_${userId}`) || {};

            // Consumir
            for (const [mat, qtd] of Object.entries(itemData.reparo)) {
                matsAtuais[mat] -= qtd;
            }
            invAtual[itemKey] -= 1;
            if (invAtual[itemKey] <= 0) delete invAtual[itemKey];

            // Entregar
            invAtual[itemData.itemOriginal] = (invAtual[itemData.itemOriginal] || 0) + 1;
            perfil.xp += xpGanho;

            await db.set(`inventario_${userId}`, invAtual);
            await db.set(`materiais_${userId}`, matsAtuais);
            await db.set(`perfil_${userId}`, perfil);

            const embed = new EmbedBuilder()
                .setTitle("🛠️ Item Restaurado!")
                .setDescription(`Sua **${itemOriginal.nome}** está pronta para o combate!`)
                .setColor("Green")
                .addFields({ name: "Ganho de XP", value: `+${xpGanho} XP` });

            await interaction.followUp({ embeds: [embed] });
        }, tempoReparo);
    }
};
