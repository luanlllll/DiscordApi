const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('Mostra a ficha completa do cidadão')
        .addUserOption(opt => opt.setName('usuario').setDescription('Ver perfil de outro player').setRequired(false)),

    async execute(interaction) {
        const alvo = interaction.options.getUser('usuario') || interaction.user;
        const membro = await interaction.guild.members.fetch(alvo.id);
        const perfil = await db.get(`perfil_${alvo.id}`);

        if (!perfil || !perfil.rp) {
            return interaction.reply({ 
                content: `Este cidadão ainda não realizou o \`/login\` oficial.`, 
                ephemeral: true 
            });
        }

        // --- CÁLCULO AUTOMÁTICO DA IDADE ---
        const dataEntrada = membro.joinedAt;
        const dataAtual = new Date();
        let mesesVividos = (dataAtual.getFullYear() - dataEntrada.getFullYear()) * 12;
        mesesVividos += dataAtual.getMonth() - dataEntrada.getMonth();
        
        const idadeAnterior = perfil.idade_anterior || 0;
        const idadeFinal = Math.max(0, mesesVividos) + idadeAnterior;

        const fotoExibir = perfil.rp.fotoUrl || alvo.displayAvatarURL({ dynamic: true, size: 1024 });

        const embed = new EmbedBuilder()
            .setTitle(`📜 Ficha de Cidadão: ${perfil.rp.nome}`)
            .setThumbnail(fotoExibir) // AQUI: Usa a foto do RP ou do Discord
            .setColor('#800000')
            .addFields(
                { name: '👑 Família', value: perfil.rp.familia, inline: true },
                { name: '♂️/♀️ Gênero', value: perfil.rp.genero, inline: true },
                { name: '🛡️ Cargo', value: perfil.rp.cargo, inline: true },
                { name: '🧬 Raça', value: perfil.rp.raca, inline: true },
                { name: '🌍 Império', value: perfil.rp.imperio, inline: true },
                { name: '⏳ Idade A.E.', value: `**${idadeFinal} anos**`, inline: true },
                { name: '💰 Dracmas', value: `${perfil.moedas || 0}`, inline: true },
                { name: '🔨 Forja', value: `Nível ${perfil.nivel || 0}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};