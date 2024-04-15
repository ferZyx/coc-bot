const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

function parseDateTime(dateTimeStr) {
    const year = parseInt(dateTimeStr.substr(0, 4));
    const month = parseInt(dateTimeStr.substr(4, 2)) - 1; // Месяцы в JavaScript начинаются с 0
    const day = parseInt(dateTimeStr.substr(6, 2));
    const hours = parseInt(dateTimeStr.substr(9, 2));
    const minutes = parseInt(dateTimeStr.substr(11, 2));
    const seconds = parseInt(dateTimeStr.substr(13, 2));

    return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
}

function getTimeUntilEvent(eventTimeStr) {
    const eventTime = parseDateTime(eventTimeStr);
    const currentTime = new Date();

    let timeDiff = eventTime - currentTime;
    if (timeDiff < 0) {
        return "Завершено";
    }

    // Переводим разницу в секунды
    timeDiff = Math.floor(timeDiff / 1000);

    // Вычисляем оставшееся количество часов, минут и секунд
    const hours = Math.floor(timeDiff / 3600);
    const minutes = Math.floor((timeDiff % 3600) / 60);
    const seconds = timeDiff % 60;

    // Генерируем сообщение
    let message = '';

    if (hours > 0) {
        message += `${hours} ч. ${minutes} мин.`;
    } else if (minutes > 0) {
        message += `${minutes} мин.`;
        if (seconds > 0) {
            message += ` ${seconds} сек.`;
        }
    } else {
        message += `${seconds} сек.`;
    }

    return message;
}

async function getRaidSeasonStatus() {
    try {
        const clanMembersResponse = await axios.get('https://api.clashofclans.com/v1/clans/%232QLGV0RR8/members', {
            headers: {
                Authorization: `Bearer ${process.env.COC_API_KEY}`
            }
        })

        const membersAttacks = {};
        clanMembersResponse.data.items.forEach(member => {
            membersAttacks[member.name] = 0;
        });

        const clanRaidSeasonsReponse = await axios.get('https://api.clashofclans.com/v1/clans/%232QLGV0RR8/capitalraidseasons', {
            headers: {
                Authorization: `Bearer ${process.env.COC_API_KEY}`
            }
        })

        const members = clanRaidSeasonsReponse.data.items[0].members;
        members.forEach(member => {
            membersAttacks[member.name] += member.attacks;
        });
        let msgText = "Стадия рейда: " + clanRaidSeasonsReponse.data.items[0].state + "\n";
        msgText += "Лут рейда: " + clanRaidSeasonsReponse.data.items[0].capitalTotalLoot + "\n\n";
        msgText += "Игроки, которые не сделали 6 атак в рейде: \n";
        for (let member in membersAttacks) {
            if (membersAttacks[member] < 6) {
                msgText += member + " - " + membersAttacks[member] + " атак\n";
            }
        }

        return msgText;

    } catch (e) {
        console.log(e);
        return "Ошибка при получении данных с сервера: " + e.stack;
    }
}

async function getClanWarStatus() {
    try {
        const clanWarResponse = await axios.get('https://api.clashofclans.com/v1/clans/%232QLGV0RR8/currentwar', {
            headers: {
                Authorization: `Bearer ${process.env.COC_API_KEY}`
            }
        })

        let msgText = "Стадия войны: " + clanWarResponse.data.state + "\n";
        msgText += "Участников: " + clanWarResponse.data.clan.members.length + "\n";

        msgText += "Счет: " + clanWarResponse.data.clan.name + " " + clanWarResponse.data.clan.stars + " - " + clanWarResponse.data.opponent.stars + " " + clanWarResponse.data.opponent.name + "\n";

        if (clanWarResponse.data.state === "inWar") {
            msgText += "Осталось времени: " + getTimeUntilEvent(clanWarResponse.data.endTime) + "\n\n";
        }

        const warMembers = clanWarResponse.data.clan.members;

        for (const member of warMembers) {
            if (!member.attacks) {
                msgText += member.name + " 0 атак\n";
            } else if (member.attacks.length < 2) {
                msgText += member.name + " 1 атака\n";
            }
        }

        return msgText;
    } catch (e) {
        console.log(e);
        return "Ошибка при получении данных с сервера: " + e.stack;
    }
}

exports.getRaidSeasonStatus = getRaidSeasonStatus;
exports.getClanWarStatus = getClanWarStatus;