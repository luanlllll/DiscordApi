const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testar_ferrugem')
        .setDescription('FORÇAR a ferrugem nos itens para teste'),

    async execute(interaction) {
        // Apenas Admins devem rodar isso!
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply("Só generais podem usar isso.");
        }

        const allData = await db.all();
        let totalAlterado = 0;

        for (const entry of allData) {
            if (entry.id.startsWith('inventario_')) {
                let inv = entry.value;
                let mudou = false;
                const itensEnferrujaveis = ['espada_ferro']; // Adicione os outros aqui

                for (const item of itensEnferrujaveis) {
                    if (inv[item] > 0) {
                        const qtd = inv[item];
                        inv[`danificado_${item}`] = (inv[`danificado_${item}`] || 0) + qtd;
                        delete inv[item];
                        mudou = true;
                    }
                }

                if (mudou) {
                    await db.set(entry.id, inv);
                    totalAlterado++;
                }
            }
        }

        await interaction.reply(`✅ Teste concluído! ${totalAlterado} inventários foram oxidados.`);
    }
};
