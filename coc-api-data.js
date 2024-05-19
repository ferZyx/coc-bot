const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

function combineStringsByCount(strings, count = 5) {
    let combined = [];
    let tempArray = [];

    strings.forEach((string, index) => {
        tempArray.push(string);

        if (tempArray.length === count) {
            combined.push(tempArray.join(" "));
            tempArray = [];
        }
    });

    if (tempArray.length > 0) {
        combined.push(tempArray.join(" "));
    }

    return combined;
}



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
        msgText += "Игроки, которые не сделали 5 атак в рейде: \n";
        const playersWithoutFiveAttacks = []
        for (let member in membersAttacks) {
            if (membersAttacks[member] < 5) {
                msgText += member + " - " + membersAttacks[member] + " атак\n";
                playersWithoutFiveAttacks.push("@" + member)
            }
        }
        const pingMassages = combineStringsByCount(playersWithoutFiveAttacks)

        msgText += "\nДля пинга: \n"
        pingMassages.forEach((value, index) => msgText+= `${index + 1}) <code>${value}</code>\n`)

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
        const warMembers = clanWarResponse.data.clan.members;
        if (!warMembers) {
            return "Война не началась";
        }
        msgText += "Участников: " + warMembers.length + "\n";

        msgText += "Счет: " + clanWarResponse.data.clan.name + " " + clanWarResponse.data.clan.stars + " - " + clanWarResponse.data.opponent.stars + " " + clanWarResponse.data.opponent.name + "\n";

        if (clanWarResponse.data.state === "inWar") {
            msgText += "Осталось времени: " + getTimeUntilEvent(clanWarResponse.data.endTime) + "\n\n";
        }


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