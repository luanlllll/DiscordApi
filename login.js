const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Registra ou altera sua ficha de cidadão em Sparta')
        .addStringOption(opt => opt.setName('nome').setDescription('Seu nome no RP').setRequired(true))
      .addStringOption(opt => opt.setName('genero').setDescription('Seu gênero').setRequired(true)
            .addChoices(
                { name: 'Masculino', value: 'Masculino' },
                { name: 'Feminino', value: 'Feminino' }
            ))
        .addStringOption(opt => opt.setName('familia').setDescription('Escolha sua linhagem/família').setRequired(true)
            .addChoices(
                { name: 'Wells', value: 'Wells' },
                { name: 'Valarior', value: 'Valarior' },
                { name: 'Dracull', value: 'Dracull' },
                { name: 'Nenhuma (Plebeu)', value: 'Nenhuma' }
            ))
        .addStringOption(opt => opt.setName('cargo').setDescription('Seu posto militar ou social').setRequired(true))
        .addStringOption(opt => opt.setName('raca').setDescription('Sua raça').setRequired(true)
            .addChoices(
                { name: 'Humano', value: 'Humano' },
                { name: 'Elfo', value: 'Elfo' },
                { name: 'Nefelin', value: 'Nefelin' },
                { name: 'Anão', value: 'Anão' }
            ))
        .addStringOption(opt => opt.setName('imperio').setDescription('Seu império de origem').setRequired(true)
            .addChoices(
                { name: 'Sparta', value: 'Sparta' },
                { name: 'Noldor', value: 'Noldor' },
                { name: 'Guardia', value: 'Guardia' },
                { name: 'Catedral', value: 'Catedral' }
            ))
        .addAttachmentOption(opt => opt.setName('foto').setDescription('Anexe a imagem do seu personagem (Opcional)').setRequired(false)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const fotoAnexo = interaction.options.getAttachment('foto');
        
        const info = {
            nome: interaction.options.getString('nome'),
            genero: interaction.options.getString('genero'),
            familia: interaction.options.getString('familia'),
            cargo: interaction.options.getString('cargo'),
            raca: interaction.options.getString('raca'),
            imperio: interaction.options.getString('imperio'),
            // Salva a URL da imagem se ela existir
            fotoUrl: fotoAnexo ? fotoAnexo.url : null 
        };

        let perfil = await db.get(`perfil_${userId}`) || { nivel: 0, xp: 0, moedas: 0 };
        const jaRegistrado = await db.get(`registro_concluido_${userId}`);

        if (jaRegistrado) {
            const custo = 50;
            if (perfil.moedas < custo) return interaction.reply({ content: "Você precisa de 50 Dracmas.", ephemeral: true });
            perfil.moedas -= custo;
        }

        perfil.rp = info;
        await db.set(`perfil_${userId}`, perfil);
        await db.set(`registro_concluido_${userId}`, true);

        const embed = new EmbedBuilder()
            .setTitle("🏛️ Registro Concluído")
            .setDescription(`Cidadão **${info.nome}** devidamente registrado.`)
            .setColor("Gold");
        
        // Mostra a foto no feedback do login para confirmar
        if (info.fotoUrl) embed.setThumbnail(info.fotoUrl);

        await interaction.reply({ embeds: [embed] });
    }
};
