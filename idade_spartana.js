const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('idade_spartana')
        .setDescription('Define sua idade anterior e calcula sua idade atual em Sparta')
        .addIntegerOption(option => 
            option.setName('idade_anterior')
                .setDescription('Anos A.E. vividos antes de entrar em Sparta')
                .setRequired(false)
                .setMinValue(0)),

    async execute(interaction) {
        const userId = interaction.user.id;
        const idadeAnterior = interaction.options.getInteger('idade_anterior') || 0;


        await db.set(`perfil_${userId}.idade_anterior`, idadeAnterior);

        const dataEntrada = interaction.member.joinedAt;
        const dataAtual = new Date();
        let mesesVividos = (dataAtual.getFullYear() - dataEntrada.getFullYear()) * 12;
        mesesVividos += dataAtual.getMonth() - dataEntrada.getMonth();
        
        const idadeTotal = Math.max(0, mesesVividos) + idadeAnterior;

        const embed = new EmbedBuilder()
            .setTitle(`🏛️ Cronologia de Sparta`)
            .setDescription(`Sua idade foi registrada e vinculada ao seu perfil!`)
            .addFields(
                { name: '⏳ Idade Atual', value: `**${idadeTotal} anos A.E.**`, inline: true },
                { name: '📜 Idade Anterior Salva', value: `${idadeAnterior} anos`, inline: true }
            )
            .setColor('#800000');

        await interaction.reply({ embeds: [embed] });
    }
};
