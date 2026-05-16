const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuickDB } = require("quick.db");
const db = new QuickDB();

const equipamentos = {
    "espada_ferro": { 
        nome: "Espada de Ferro", 
        grau: "comum",
        tempo: 60000, // 1 minuto
        xp: 5,
        materiais: { ferro: 5, madeira: 2 } 
    },
    "danificado_espada_ferro": { 
        nome: "Espada de Ferro (Danificada)", 
        grau: "comum",
        itemOriginal: "espada_ferro", 
        reparo: { ferro: 2, madeira: 1 } 
    }
};


const chancesBase = {
    "comum": 80, 
    "raro": 60, 
    "epico": 40, 
    "lendario": 20, 
    "unico": 5
};
module.exports = {
    data: new SlashCommandBuilder()
        .setName('forjar')
        .setDescription('Tenta forjar um equipamento')
        .addStringOption(option => 
            option.setName('item')
                .setDescription('O nome do item para forjar')
                .setRequired(true)
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        
        const todasAsChaves = Object.keys(equipamentos); 

        const apenasItensParaForja = todasAsChaves.filter(key => {
            return !key.startsWith('danificado_') && equipamentos[key].materiais;
        });

        const filtrado = apenasItensParaForja.filter(escolha => 
            equipamentos[escolha].nome.toLowerCase().includes(focusedValue)
        );

        await interaction.respond(
            filtrado.slice(0, 25).map(escolha => ({ 
                name: equipamentos[escolha].nome, 
                value: escolha 
            })),
        );
    },
     async execute(interaction) {
        const userId = interaction.user.id;
        const itemNome = interaction.options.getString('item').toLowerCase();
        const item = equipamentos[itemNome];

        if (!item) return interaction.reply("Item não encontrado!");

        let perfil = await db.get(`perfil_${userId}`) || { nivel: 0, xp: 0 };
        let materiais_player = await db.get(`materiais_${userId}`) || { ferro: 0, madeira: 0 };

        // Verifica se tem os materiais
        for (const [mat, qtd] of Object.entries(item.materiais)) {
            if (!materiais_player[mat] || materiais_player[mat] < qtd) {
                return interaction.reply(`❌ Faltam materiais! Você precisa de ${qtd}x ${mat}.`);
            }
        }

        for (const [mat, qtd] of Object.entries(item.materiais)) {
            materiais_player[mat] -= qtd;
        }
        await db.set(`materiais_${userId}`, materiais_player);

        await interaction.deferReply();

        const chanceFinal = (chancesBase[item.grau] || 50) + (perfil.nivel * 2);
        const dado = Math.floor(Math.random() * 100) + 1;

        const embedEspera = new EmbedBuilder()
            .setTitle("🔨 Forjando...")
            .setDescription(`Materiais consumidos! Trabalhando no item: **${item.nome}**\nSua chance: **${chanceFinal}%**`)
            .setColor("Yellow");

        await interaction.editReply({ embeds: [embedEspera] });

        setTimeout(async () => {
            let p = await db.get(`perfil_${userId}`) || { nivel: 0, xp: 0 };

            if (dado <= chanceFinal) {
                // SUCESSO
                await db.add(`inventario_${userId}.${itemNome}`, 1);
                
                p.xp += item.xp;

                let subiuNivel = false;
                while (p.nivel < 10) {
                    let xpMax = 100 + (p.nivel * 50);
                    if (p.xp >= xpMax) {
                        p.xp -= xpMax; 
                        p.nivel += 1;
                        subiuNivel = true;
                    } else {
                        break;
                    }
                }

                await db.set(`perfil_${userId}`, p);

                const sucessoEmbed = new EmbedBuilder()
                    .setTitle("✅ Sucesso!")
                    .setDescription(`Você forjou **${item.nome}**!\n${subiuNivel ? `⭐ **LEVEL UP!** Você agora é nível **${p.nivel}**!` : ""}`)
                    .addFields(
                        { name: 'XP Atual', value: `${p.xp} / ${100 + (p.nivel * 50)}`, inline: true },
                        { name: 'Nível', value: `${p.nivel}`, inline: true }
                    )
                    .setColor("Green");
                
                await interaction.editReply({ embeds: [sucessoEmbed] });

            } else {
                
                p.xp += 2;
                await db.set(`perfil_${userId}`, p);

                await interaction.editReply({ 
                    content: `❌ A forja falhou! Os materiais foram perdidos no fogo.`, 
                    embeds: [] 
                });
            }
        }, item.tempo);
    }

module.exports.equipamentos = equipamentos; 
