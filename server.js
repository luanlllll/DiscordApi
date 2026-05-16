const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Exibe informações e a lista de membros do servidor'),

    async execute(interaction) {
        // 1. O bot avisa que está processando (evita o erro de "não respondeu")
        await interaction.deferReply();

        try {
            // 2. Garante que todos os membros foram carregados no cache
            const members = await interaction.guild.members.fetch();
            
            // 3. Mapeia os nomes (limita a exibição para não quebrar o limite de caracteres)
            const memberList = members.map(m => m.user.username).join(', ');
            
            // Corta o texto se ele for maior que 1024 caracteres (limite de campos do Embed)
            const trimmedList = memberList.length > 1024 
                ? memberList.substring(0, 1021) + '...' 
                : memberList;

            // 4. Cria um Embed bonitão
            const serverEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`Informações de ${interaction.guild.name}`)
                .addFields(
                    { name: 'Total de Membros', value: `${interaction.guild.memberCount}`, inline: true },
                    { name: 'Dono', value: `<@${interaction.guild.ownerId}>`, inline: true },
                    { name: 'Lista de Membros', value: trimmedList || 'Nenhum membro encontrado.' }
                )
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${interaction.user.tag}` });

            // 5. Envia a resposta final
            await interaction.editReply({ embeds: [serverEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply('Houve um erro ao tentar listar os membros.');
        }
    },
};
