const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('entregar')
        .setDescription('Doar materiais ou equipamentos para outro jogador')
        .addSubcommand(sub =>
            sub.setName('material')
                .setDescription('Entregar materiais')
                .addStringOption(opt => opt.setName('tipo').setDescription('Qual material?').setRequired(true)
                    .addChoices(
                        { name: 'Ferro', value: 'ferro' },
                        { name: 'Madeira', value: 'madeira' }
                    ))
                .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantidade para doar').setRequired(true).setMinValue(1))
                .addUserOption(opt => opt.setName('usuario').setDescription('Para quem você quer doar?').setRequired(true))
        )
        .addSubcommand(sub =>
            sub.setName('item')
                .setDescription('Entregar um equipamento')
                .addStringOption(opt => opt.setName('nome')
                    .setDescription('Escolha um item do seu inventário')
                    .setRequired(true)
                    .setAutocomplete(true))
                .addIntegerOption(opt => opt.setName('quantidade').setDescription('Quantidade para doar').setRequired(true).setMinValue(1))
                .addUserOption(opt => opt.setName('usuario').setDescription('Para quem você quer doar?').setRequired(true))
        ),

    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const userId = interaction.user.id;

        if (focusedOption.name === 'nome') {
            const inv = await db.get(`inventario_${userId}`) || {};
            const itensQuePossui = Object.keys(inv); // Pega só o que o player tem

            // autocomplete Filtrado pelo que está sendo digitando
            const filtrado = itensQuePossui.filter(item => 
                item.toLowerCase().includes(focusedOption.value.toLowerCase())
            );

            await interaction.respond(
                filtrado.slice(0, 25).map(item => ({ 
                    name: `${item.replace(/_/g, ' ')} (Você tem: ${inv[item]})`, 
                    value: item 
                }))
            );
        }
    },

    async execute(interaction) {
        const RemetenteId = interaction.user.id;
        const alvo = interaction.options.getUser('usuario');
        const quantidade = interaction.options.getInteger('quantidade');
        const sub = interaction.options.getSubcommand();

        if (alvo.id === RemetenteId) return interaction.reply({ content: "Você não pode doar para si mesmo!", ephemeral: true });
        if (alvo.bot) return interaction.reply({ content: "Bots não têm inventário!", ephemeral: true });

        if (sub === 'material') {
            const tipo = interaction.options.getString('tipo');
            let matsDoador = await db.get(`materiais_${RemetenteId}`) || {};
            
            if (!matsDoador[tipo] || matsDoador[tipo] < quantidade) {
                return interaction.reply({ content: `Você não tem ${quantidade}x ${tipo} para doar!`, ephemeral: true });
            }

            matsDoador[tipo] -= quantidade;
            await db.set(`materiais_${RemetenteId}`, matsDoador);
            
            let matsAlvo = await db.get(`materiais_${alvo.id}`) || { ferro: 0, madeira: 0 };
            matsAlvo[tipo] = (matsAlvo[tipo] || 0) + quantidade;
            await db.set(`materiais_${alvo.id}`, matsAlvo);

            const embedMat = new EmbedBuilder()
                .setTitle("📦 Doação de Materiais")
                .setDescription(`**${interaction.user.username}** entregou **${quantidade}x ${tipo}** para **${alvo.username}**!`)
                .setColor("Gold");

            return interaction.reply({ embeds: [embedMat] });
        }

        if (sub === 'item') {
            const itemNome = interaction.options.getString('nome').toLowerCase();
            let invDoador = await db.get(`inventario_${RemetenteId}`) || {};

            if (!invDoador[itemNome] || invDoador[itemNome] < quantidade) {
                return interaction.reply({ content: `Você não tem ${quantidade}x ${itemNome.replace(/_/g, ' ')} no inventário!`, ephemeral: true });
            }

            invDoador[itemNome] -= quantidade;
            if (invDoador[itemNome] <= 0) delete invDoador[itemNome]; 
            await db.set(`inventario_${RemetenteId}`, invDoador);

            let invAlvo = await db.get(`inventario_${alvo.id}`) || {};
            invAlvo[itemNome] = (invAlvo[itemNome] || 0) + quantidade;
            await db.set(`inventario_${alvo.id}`, invAlvo);

            const embedItem = new EmbedBuilder()
                .setTitle("⚔️ Entrega de Equipamento")
                .setDescription(`**${interaction.user.username}** entregou **${quantidade}x ${itemNome.replace(/_/g, ' ')}** para **${alvo.username}**!`)
                .setColor("LuminousVividPink");

            return interaction.reply({ embeds: [embedItem] });
        }
    }
};
