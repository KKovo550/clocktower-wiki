/* Curated recording forms tied to local catalog definitions; effects remain Storyteller decisions. */
(function(root){
 'use strict';
 const profiles=[
  {
    "id": "beggar",
    "name": "乞丐",
    "team": "traveller",
    "ability": "你只能使用投票标记才能投票。 死亡的玩家可以将他的投票标记给你，如果他这么做，你会得知他的阵营。 你不会中毒和醉酒。"
  },
  {
    "id": "scapegoat",
    "name": "替罪羊",
    "team": "traveller",
    "ability": "如果你的阵营的一名玩家被处决，你可能会代替他被处决。"
  },
  {
    "id": "gunslinger",
    "name": "枪手",
    "team": "traveller",
    "ability": "每个白天，当首次投票被统计后，你可以选择一名刚投过票的玩家：他死亡。"
  },
  {
    "id": "thief",
    "name": "窃贼",
    "team": "traveller",
    "ability": "每个夜晚，你要选择除你以外的一名玩家：明天白天他的投票会被算作负数。"
  },
  {
    "id": "bureaucrat",
    "name": "官员",
    "team": "traveller",
    "ability": "每个夜晚，你要选择除你以外的一名玩家：明天白天，他的投票算作三票。"
  },
  {
    "id": "washerwoman",
    "name": "洗衣妇",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知两名玩家和一个镇民角色：这两名玩家之一是该角色。"
  },
  {
    "id": "librarian",
    "name": "图书管理员",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知两名玩家和一个外来者角色：这两名玩家之一是该角色（或者你会得知没有外来者在场）。"
  },
  {
    "id": "investigator",
    "name": "调查员",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知两名玩家和一个爪牙角色：这两名玩家之一是该角色（或者你会得知没有爪牙在场）。"
  },
  {
    "id": "chef",
    "name": "厨师",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知场上邻座的邪恶玩家有多少对。"
  },
  {
    "id": "empath",
    "name": "共情者",
    "team": "townsfolk",
    "ability": "每个夜晚，你会得知与你邻近的两名存活的玩家中邪恶玩家的数量。"
  },
  {
    "id": "fortune_teller",
    "name": "占卜师",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择两名玩家：你会得知他们之中是否有恶魔。 会有一名善良玩家始终被你的能力当作恶魔。"
  },
  {
    "id": "undertaker",
    "name": "送葬者",
    "team": "townsfolk",
    "ability": "每个夜晚*，你会得知今天白天死于处决的玩家的角色。"
  },
  {
    "id": "monk",
    "name": "僧侣",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要选择除你以外的一名玩家：当晚恶魔的负面能力对他无效。"
  },
  {
    "id": "ravenkeeper",
    "name": "守鸦人",
    "team": "townsfolk",
    "ability": "如果你在夜晚死亡，你会被唤醒，然后你要选择一名玩家：你会得知他的角色。"
  },
  {
    "id": "virgin",
    "name": "贞洁者",
    "team": "townsfolk",
    "ability": "当你首次被提名时，如果提名你的玩家是镇民，他立刻被处决。"
  },
  {
    "id": "slayer",
    "name": "猎手",
    "team": "townsfolk",
    "ability": "每局游戏限一次，你可以在白天时公开选择一名玩家：如果他是恶魔，他死亡。"
  },
  {
    "id": "soldier",
    "name": "士兵",
    "team": "townsfolk",
    "ability": "恶魔的负面能力对你无效。"
  },
  {
    "id": "mayor",
    "name": "镇长",
    "team": "townsfolk",
    "ability": "如果只有三名玩家存活且白天没有人被处决，你的阵营获胜。 如果你在夜晚即将死亡，可能会有一名其他玩家代替你死亡。"
  },
  {
    "id": "butler",
    "name": "管家",
    "team": "outsider",
    "ability": "每个夜晚，你要选择除你以外的一名玩家：明天白天，只有他投票时你才能投票。"
  },
  {
    "id": "drunk",
    "name": "酒鬼",
    "team": "outsider",
    "ability": "你不知道你是酒鬼。你以为你是一个镇民角色，但其实你不是。"
  },
  {
    "id": "recluse",
    "name": "陌客",
    "team": "outsider",
    "ability": "你可能会被当作邪恶阵营、爪牙角色或恶魔角色，即使你已死亡。"
  },
  {
    "id": "saint",
    "name": "圣徒",
    "team": "outsider",
    "ability": "如果你死于处决，你的阵营落败。"
  },
  {
    "id": "poisoner",
    "name": "投毒者",
    "team": "minion",
    "ability": "每个夜晚，你要选择一名玩家：他在当晚和明天白天中毒。"
  },
  {
    "id": "spy",
    "name": "间谍",
    "team": "minion",
    "ability": "每个夜晚，你能查看魔典。 你可能会被当作善良阵营、镇民角色或外来者角色，即使你已死亡。"
  },
  {
    "id": "scarlet_woman",
    "name": "红唇女郎",
    "team": "minion",
    "ability": "如果大于等于五名玩家存活时（旅行者不计算在内）恶魔死亡，你变成那个恶魔。"
  },
  {
    "id": "baron",
    "name": "男爵",
    "team": "minion",
    "ability": "会有额外的外来者在场。[+2 外来者]"
  },
  {
    "id": "imp",
    "name": "小恶魔",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。如果你以这种方式自杀，一名爪牙会变成小恶魔。"
  }
];
 profiles.push(...[
  {
    "id": "deviant",
    "name": "怪咖",
    "team": "traveller",
    "ability": "如果你表现得很有趣，当天你不能被流放。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "snv"
  },
  {
    "id": "bone_collector",
    "name": "集骨者",
    "team": "traveller",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一名死亡的玩家：他重新获得能力直到下个黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "集骨者选择不使用能力，或指向一名死亡玩家。放置恢复能力标记提示，并且该玩家当晚可能会因此醒来并使用能力。",
    "script": "snv"
  },
  {
    "id": "butcher",
    "name": "屠夫",
    "team": "traveller",
    "ability": "每个白天，首次处决后，你可以再次发起提名。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "snv"
  },
  {
    "id": "harlot",
    "name": "流莺",
    "team": "traveller",
    "ability": "每个夜晚*，你要选择一名存活的玩家：如果他同意，你会得知他的角色，但是你们两个可能同时死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "流莺选择一名玩家，将其唤醒，那名玩家选择同意或拒绝。如果同意，将他的角色标记展示给流莺看。然后说书人可以决定两名玩家是否会一起死去。",
    "script": "snv"
  },
  {
    "id": "barista",
    "name": "咖啡师",
    "team": "traveller",
    "ability": "每个夜晚，直至下个黄昏，由说书人二选一：1）一名玩家解除并免受醉酒和中毒影响，且会得知正确信息；2）一名玩家的能力可以生效两次。该玩家会得知是哪个效果。",
    "firstNightReminder": "说书人选择一名玩家唤醒，并告诉他触发了咖啡师的什么效果。",
    "otherNightReminder": "说书人选择一名玩家唤醒，并告诉他触发了咖啡师的什么效果。",
    "script": "snv"
  },
  {
    "id": "clockmaker",
    "name": "钟表匠",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知恶魔与爪牙之间最近的距离。（邻座的玩家距离为1）",
    "firstNightReminder": "给他展示数字手势来告诉他恶魔与爪牙之间最近的距离。",
    "otherNightReminder": "",
    "script": "snv"
  },
  {
    "id": "dreamer",
    "name": "筑梦师",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择除你及旅行者以外的一名玩家：你会得知一个善良角色和一个邪恶角色，该玩家是其中一个角色。",
    "firstNightReminder": "让筑梦师指向一名玩家。对他展示善良和邪恶的角色标记各一个，其中一个是属于该玩家的角色。",
    "otherNightReminder": "让筑梦师指向一名玩家。对他展示善良和邪恶的角色标记各一个，其中一个是属于该玩家的角色。",
    "script": "snv"
  },
  {
    "id": "snake_charmer",
    "name": "舞蛇人",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择一名存活的玩家：如果你选中了恶魔，你和他交换角色和阵营，然后他中毒。",
    "firstNightReminder": "让舞蛇人选择一名玩家。如果舞蛇人选中了恶魔：展示“你是”信息标记和恶魔角色标记。用拇指向下代表他阵营变为邪恶。在魔典中交换舞蛇人和恶魔的角色标记。让原来的舞蛇人重新入睡。唤醒原来的恶魔。对老恶魔展示“你是”信息标记和舞蛇人角色标记，并用拇指向上代表他阵营变为善良。",
    "otherNightReminder": "让舞蛇人选择一名玩家。如果舞蛇人选中了恶魔：展示“你是”信息标记和恶魔角色标记。用拇指向下代表他阵营变为邪恶。在魔典中交换舞蛇人和恶魔的角色标记。让原来的舞蛇人重新入睡。唤醒原来的恶魔。对老恶魔展示“你是”信息标记和舞蛇人角色标记，并用拇指向上代表他阵营变为善良。",
    "script": "snv"
  },
  {
    "id": "mathematician",
    "name": "数学家",
    "team": "townsfolk",
    "ability": "每个夜晚，你会得知有多少名玩家的能力因为其他角色的能力而未正常生效。（从上个黎明到你被唤醒时）",
    "firstNightReminder": "给他展示数字手势来告诉他在首个夜晚里有多少玩家的角色能力受他人影响而未正常生效。",
    "otherNightReminder": "给他展示数字手势来告诉他从上个黎明到数学家醒来前有多少玩家的角色能力受他人影响而未正常生效。",
    "script": "snv"
  },
  {
    "id": "flowergirl",
    "name": "卖花女孩",
    "team": "townsfolk",
    "ability": "每个夜晚*，你会得知在今天白天时是否有恶魔投过票。",
    "firstNightReminder": "",
    "otherNightReminder": "对她点头或摇头来示意今天白天是否有恶魔投过票。",
    "script": "snv"
  },
  {
    "id": "town_crier",
    "name": "城镇公告员",
    "team": "townsfolk",
    "ability": "每个夜晚*，你会得知在今天白天时是否有爪牙发起过提名。",
    "firstNightReminder": "",
    "otherNightReminder": "对他点头或摇头示意今天白天是否有爪牙发起过提名。",
    "script": "snv"
  },
  {
    "id": "oracle",
    "name": "神谕者",
    "team": "townsfolk",
    "ability": "每个夜晚*，你会得知有多少名死亡的玩家是邪恶的。",
    "firstNightReminder": "",
    "otherNightReminder": "给他展示数字手势来告诉他当前已死亡的玩家中有多少玩家是邪恶的。",
    "script": "snv"
  },
  {
    "id": "savant",
    "name": "博学者",
    "team": "townsfolk",
    "ability": "每个白天，你可以私下询问说书人以得知两条信息：一个是正确的，一个是错误的。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "snv"
  },
  {
    "id": "seamstress",
    "name": "女裁缝",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时，你可以选择除你以外的两名玩家：你会得知他们是否为同一阵营。",
    "firstNightReminder": "女裁缝可以选择除自己以外的两名玩家。如果她这么做了，对她点头或摇头示意这两名玩家是否为同一阵营，随后标记女裁缝失去能力。之后的夜晚无需再唤醒女裁缝。",
    "otherNightReminder": "女裁缝可以选择除自己以外的两名玩家。如果她这么做了，对她点头或摇头示意这两名玩家是否为同一阵营，随后标记女裁缝失去能力。之后的夜晚无需再唤醒女裁缝。",
    "script": "snv"
  },
  {
    "id": "philosopher",
    "name": "哲学家",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时，你可以选择一个善良角色：你获得该角色的能力。 如果这个角色在场，他醉酒。",
    "firstNightReminder": "哲学家可以选择一个角色。如果选择的角色不在场，将哲学家的角色标题替换成对应角色，并标记“是哲学家”，否则标记该角色对应的玩家醉酒。从现在开始，你需要以哲学家获得能力的那种角色的行动方式来唤醒哲学家。",
    "otherNightReminder": "哲学家可以选择一个角色。如果选择的角色不在场，将哲学家的角色标题替换成对应角色，并标记“是哲学家”，否则标记该角色对应的玩家醉酒。从现在开始，你需要以哲学家获得能力的那种角色的行动方式来唤醒哲学家。",
    "script": "snv"
  },
  {
    "id": "artist",
    "name": "艺术家",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在白天时，你可以私下询问说书人一个是非问题，你会得知该问题的答案。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "snv"
  },
  {
    "id": "juggler",
    "name": "杂耍艺人",
    "team": "townsfolk",
    "ability": "在你的首个白天，你可以公开猜测任意玩家的角色最多五次。在当晚，你会得知猜测正确的角色数量。",
    "firstNightReminder": "",
    "otherNightReminder": "给他展示数字手势来告诉他他当天白天猜测正确的次数。",
    "script": "snv"
  },
  {
    "id": "sage",
    "name": "贤者",
    "team": "townsfolk",
    "ability": "如果恶魔杀死了你，在当晚你会被唤醒并得知两名玩家，其中一名是杀死你的那个恶魔。",
    "firstNightReminder": "",
    "otherNightReminder": "如果恶魔杀死了贤者，唤醒贤者并指向两名玩家，其中一名玩家是杀死他的恶魔。",
    "script": "snv"
  },
  {
    "id": "mutant",
    "name": "畸形秀演员",
    "team": "outsider",
    "ability": "如果你“疯狂”地证明自己是外来者，你可能被处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "snv"
  },
  {
    "id": "sweetheart",
    "name": "心上人",
    "team": "outsider",
    "ability": "当你死亡时，会有一名玩家开始醉酒。",
    "firstNightReminder": "",
    "otherNightReminder": "如果心上人死亡，会有一名玩家立刻醉酒。如果你还没有让这件事情发生，那么现在为任意一位玩家放置醉酒标记。",
    "script": "snv"
  },
  {
    "id": "barber",
    "name": "理发师",
    "team": "outsider",
    "ability": "如果你死亡，在当晚恶魔可以选择两名玩家（不能选择其他恶魔）交换角色。",
    "firstNightReminder": "",
    "otherNightReminder": "如果理发师今天死亡了，唤醒恶魔并展示“该角色的效果对你生效”信息标记和理发师角色标记。如果恶魔选择了两名玩家，将这两名玩家分别独自唤醒。对他们展示“你是”信息标记和他们的新角色标记。",
    "script": "snv"
  },
  {
    "id": "klutz",
    "name": "呆瓜",
    "team": "outsider",
    "ability": "当你得知你死亡时，你要公开选择一名存活的玩家：如果他是邪恶的，你的阵营落败。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "snv"
  },
  {
    "id": "evil_twin",
    "name": "镜像双子",
    "team": "minion",
    "ability": "你与一名对立阵营的玩家互相知道对方是什么角色。 如果其中善良玩家被处决，邪恶阵营获胜。 如果你们都存活，善良阵营无法获胜。",
    "firstNightReminder": "唤醒镜像双子和他的对立双子，让他们进行眼神接触。对镜像双子展示对立双子的角色标记，并对对立双子展示镜像双子的角色标记。",
    "otherNightReminder": "",
    "script": "snv"
  },
  {
    "id": "witch",
    "name": "女巫",
    "team": "minion",
    "ability": "每个夜晚，你要选择一名玩家：如果他明天白天发起提名，他死亡。如果只有三名存活的玩家，你失去此能力。",
    "firstNightReminder": "让女巫选择一名玩家。标记那名玩家被诅咒。",
    "otherNightReminder": "让女巫选择一名玩家。标记那名玩家被诅咒。",
    "script": "snv"
  },
  {
    "id": "cerenovus",
    "name": "洗脑师",
    "team": "minion",
    "ability": "每个夜晚，你要选择一名玩家和一个善良角色。他明天白天和夜晚需要“疯狂”地证明自己是这个角色，不然他可能被处决。",
    "firstNightReminder": "让洗脑师选择一名玩家和一个善良角色。标记那名玩家疯狂。让洗脑师重新入睡。唤醒洗脑师的目标。对这名玩家展示“该角色的能力对你生效”信息标记，洗脑师角色标记，该玩家需要疯狂证明的角色标记。",
    "otherNightReminder": "让洗脑师选择一名玩家和一个善良角色。标记那名玩家疯狂。让洗脑师重新入睡。唤醒洗脑师的目标。对这名玩家展示“该角色的能力对你生效”信息标记，洗脑师角色标记，该玩家需要疯狂证明的角色标记。",
    "script": "snv"
  },
  {
    "id": "pit-hag",
    "name": "麻脸巫婆",
    "team": "minion",
    "ability": "每个夜晚*，你要选择一名玩家和一个角色，如果该角色不在场，他变成该角色。如果因此创造了一个恶魔，当晚的死亡由说书人决定。",
    "firstNightReminder": "",
    "otherNightReminder": "让麻脸巫婆选择一名玩家和一个角色。如果她选择的角色不在场：让麻脸巫婆重新入睡。唤醒她的目标玩家。对该玩家展示“你是”信息标记和他的新角色标记。",
    "script": "snv"
  },
  {
    "id": "fang_gu",
    "name": "方古",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。 被该能力杀死的外来者改为变成邪恶的方古且你代替他死亡，但每局游戏仅能成功转化一次。[+1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "让方古选择一名玩家。标记那名玩家死亡。如果他选择了外来者，且“首次”标记未放置在魔典中：用备用的方古角色标记替换那名外来者的角色标记。让方古重新入睡。唤醒方古的目标玩家。对该玩家展示“你是”信息标记和方古角色标记，并用拇指向下代表他阵营变为邪恶。将“首次”标记放置在魔典中。标记原本的方古玩家死亡，且他选择的玩家不会被标记为死亡。",
    "script": "snv"
  },
  {
    "id": "vigormortis",
    "name": "亡骨魔",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。 被你杀死的爪牙保留他的能力，且与他邻近的两名镇民之一中毒。[-1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "让亡骨魔选择一名玩家。标记那名玩家死亡。如果该玩家是爪牙，标记该玩家保留能力，并标记与该玩家邻近的镇民玩家之一中毒。",
    "script": "snv"
  },
  {
    "id": "no_dashii",
    "name": "诺-达鲺",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。 与你邻近的两名镇民中毒。",
    "firstNightReminder": "",
    "otherNightReminder": "让诺-达鲺选择一名玩家。标记那名玩家死亡。",
    "script": "snv"
  },
  {
    "id": "vortox",
    "name": "涡流",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。 镇民玩家的能力都会产生错误信息。 如果白天没人被处决，邪恶阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "让涡流选择一名玩家。标记那名玩家死亡。",
    "script": "snv"
  },
  {
    "id": "voudon",
    "name": "巫毒师",
    "team": "traveller",
    "ability": "只有你和死亡的玩家可以投票，且投票不需要使用投票标记。忽略票数需要过半的要求。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "bmr"
  },
  {
    "id": "bishop",
    "name": "主教",
    "team": "traveller",
    "ability": "只有说书人可以发起提名。每个白天说书人至少要提名一名你对立阵营的玩家。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "bmr"
  },
  {
    "id": "judge",
    "name": "法官",
    "team": "traveller",
    "ability": "每局游戏限一次，如果其他玩家发起了提名，你可以选择让本次提名直接执行处决或让投票无效。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "bmr"
  },
  {
    "id": "matron",
    "name": "女舍监",
    "team": "traveller",
    "ability": "每个白天，你可以选择至多三对玩家交换座位。 玩家不能离开座位私聊。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "bmr"
  },
  {
    "id": "apprentice",
    "name": "学徒",
    "team": "traveller",
    "ability": "在你的首个夜晚，如果你是善良的，你会获得一个镇民角色的能力；如果你是邪恶的，你会获得一个爪牙角色的能力。",
    "firstNightReminder": "对学徒展示一个镇民或爪牙标记。在魔典中，用那个角色标记代替学徒标记，并在一旁标识该玩家是学徒。",
    "otherNightReminder": "",
    "script": "bmr"
  },
  {
    "id": "grandmother",
    "name": "祖母",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知一名善良玩家和他的角色。 如果恶魔杀死了他，你也会死亡。",
    "firstNightReminder": "指向她的孙子玩家，并展示该玩家的角色标记。",
    "otherNightReminder": "如果孙子被恶魔杀死，祖母也会一同死亡。标记祖母死亡。",
    "script": "bmr"
  },
  {
    "id": "sailor",
    "name": "水手",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择一名存活的玩家：你或他之一会醉酒直到下个黄昏。 你不会死亡。",
    "firstNightReminder": "让水手选择一名存活玩家。标记那名玩家或水手醉酒。",
    "otherNightReminder": "让水手选择一名存活玩家。标记那名玩家或水手醉酒。",
    "script": "bmr"
  },
  {
    "id": "chambermaid",
    "name": "侍女",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择除你以外的两名存活的玩家：你会得知他们中有几人在当晚因其自身能力而被唤醒。",
    "firstNightReminder": "让侍女选择除自己外的两名存活玩家。给她展示数字手势来告诉她这些玩家中有几人因自身能力被唤醒。",
    "otherNightReminder": "让侍女选择除自己外的两名存活玩家。给她展示数字手势来告诉她这些玩家中有几人因自身能力被唤醒。",
    "script": "bmr"
  },
  {
    "id": "exorcist",
    "name": "驱魔人",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要选择一名玩家（与上个夜晚不同）：如果你选中了恶魔，他会得知你是驱魔人，但他当晚不会因其自身能力而被唤醒。",
    "firstNightReminder": "",
    "otherNightReminder": "让驱魔人选择一名玩家，不能是上一夜他选择过的玩家。让驱魔人重新入睡。如果驱魔人选中了恶魔：唤醒恶魔。展示“该角色的能力对你生效”信息标记和驱魔人角色标记。指向驱魔人玩家。",
    "script": "bmr"
  },
  {
    "id": "innkeeper",
    "name": "旅店老板",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要选择两名玩家：他们当晚不会死亡，但其中一人会醉酒到下个黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "让旅店老板选择两名玩家。标记这两名玩家不会死亡，并标记其中一人醉酒。",
    "script": "bmr"
  },
  {
    "id": "gambler",
    "name": "赌徒",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要选择一名玩家并猜测该玩家的角色：如果你猜错了，你会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "让赌徒选择一名玩家和一个角色。如果赌徒猜错了，标记赌徒死亡。",
    "script": "bmr"
  },
  {
    "id": "gossip",
    "name": "造谣者",
    "team": "townsfolk",
    "ability": "每个白天，你可以公开发表一个声明。如果该声明正确，在当晚会有一名玩家死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果白天的声明为真，会有一名玩家死亡，并由说书人来选择一名玩家，标记该玩家死亡。",
    "script": "bmr"
  },
  {
    "id": "courtier",
    "name": "侍臣",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时，你可以选择一个角色：如果该角色在场，该角色之一从当晚开始醉酒三天三夜。",
    "firstNightReminder": "侍臣可以选择一个角色。如果他这么做了，标记侍臣失去能力，标记被选择的角色所对应的玩家醉酒。之后的夜晚无需再唤醒侍臣。",
    "otherNightReminder": "侍臣可以选择一个角色。如果他这么做了，标记侍臣失去能力，标记被选择的角色所对应的玩家醉酒。之后的夜晚无需再唤醒侍臣。",
    "script": "bmr"
  },
  {
    "id": "professor",
    "name": "教授",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一名死亡的玩家：如果他是镇民，你会将他起死回生。",
    "firstNightReminder": "",
    "otherNightReminder": "教授可以选择一名死亡玩家。如果他这么做了，标记教授失去能力，然后如果那名玩家是镇民，标记那名玩家被复活。之后的夜晚无需再唤醒教授。",
    "script": "bmr"
  },
  {
    "id": "minstrel",
    "name": "吟游诗人",
    "team": "townsfolk",
    "ability": "当一名爪牙死于处决时，除了你和旅行者以外的所有其他玩家醉酒直到明天黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "bmr"
  },
  {
    "id": "tea_lady",
    "name": "茶艺师",
    "team": "townsfolk",
    "ability": "如果与你邻近的两名存活的玩家是善良的，他们不会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "bmr"
  },
  {
    "id": "pacifist",
    "name": "和平主义者",
    "team": "townsfolk",
    "ability": "被处决的善良玩家可能不会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "bmr"
  },
  {
    "id": "fool",
    "name": "弄臣",
    "team": "townsfolk",
    "ability": "当你首次将要死亡时，你不会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "bmr"
  },
  {
    "id": "tinker",
    "name": "修补匠",
    "team": "outsider",
    "ability": "你随时可能死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "修补匠可能会死亡。如果说书人选择让修补匠死亡，放置死亡标记。",
    "script": "bmr"
  },
  {
    "id": "moonchild",
    "name": "月之子",
    "team": "outsider",
    "ability": "当你得知你死亡时，你要公开选择一名存活的玩家。如果他是善良的，在当晚他会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果月之子在白天触发了死亡能力并选择了一名善良玩家，该玩家死亡。标记那名玩家死亡。",
    "script": "bmr"
  },
  {
    "id": "goon",
    "name": "莽夫",
    "team": "outsider",
    "ability": "每个夜晚，首个使用其自身能力选择了你的玩家会醉酒直到下个黄昏。你会转变为他的阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "bmr"
  },
  {
    "id": "lunatic",
    "name": "疯子",
    "team": "outsider",
    "ability": "你以为你是一个恶魔，但其实你不是。 恶魔知道你是疯子以及你在每个夜晚选择了哪些玩家。",
    "firstNightReminder": "如果有七名或更多玩家，唤醒疯子：展示“他们是你的爪牙”信息标记。指向任意对应数量的玩家。展示“这些角色不在场”信息标记。展示三个善良角色。让疯子重新入睡。唤醒恶魔。展示“你是”信息标记和恶魔角色标记。展示“这名玩家是”信息标记和疯子角色标记，然后指向疯子玩家。",
    "otherNightReminder": "做任何需要做的事情来模拟一位恶魔的行动。让疯子重新入睡。唤醒恶魔。对恶魔展示疯子角色标记，并指向疯子玩家，随后是疯子的攻击目标。",
    "script": "bmr"
  },
  {
    "id": "godfather",
    "name": "教父",
    "team": "minion",
    "ability": "在你的首个夜晚，你会得知有哪些外来者角色在场。 如果有外来者在白天死亡，你会在当晚被唤醒并且你要选择一名玩家：他死亡。[-1或+1外来者]",
    "firstNightReminder": "对他展示所有在场的外来者标记。",
    "otherNightReminder": "如果有外来者在今天白天死亡，让教父选择一名玩家。标记那名玩家死亡。",
    "script": "bmr"
  },
  {
    "id": "devils_advocate",
    "name": "魔鬼代言人",
    "team": "minion",
    "ability": "每个夜晚，你要选择一名存活的玩家（与上个夜晚不同）：如果明天白天他被处决，他不会死亡。",
    "firstNightReminder": "让魔鬼代言人选择一名存活玩家。标记那名玩家处决不死。",
    "otherNightReminder": "让魔鬼代言人选择一名存活玩家，不能是上一夜他选择过的玩家。标记那名玩家处决不死。",
    "script": "bmr"
  },
  {
    "id": "assassin",
    "name": "刺客",
    "team": "minion",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一名玩家：他死亡，即使因为任何原因让他不会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "刺客可以选择一名玩家。如果他这么做了，标记那名玩家死亡，且刺客失去能力，之后的夜晚无需再唤醒刺客。",
    "script": "bmr"
  },
  {
    "id": "mastermind",
    "name": "主谋",
    "team": "minion",
    "ability": "如果恶魔因为死于处决而因此导致游戏结束时，再额外进行一个夜晚和一个白天。在那个白天如果有玩家被处决，他的阵营落败。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "bmr"
  },
  {
    "id": "zombuul",
    "name": "僵怖",
    "team": "demon",
    "ability": "每个夜晚*，如果今天白天没有人死亡，你会被唤醒并要选择一名玩家：他死亡。 当你首次死亡后，你仍存活，但会被当作死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果今天白天没有人死亡，让僵怖选择一名玩家。标记那名玩家死亡。",
    "script": "bmr"
  },
  {
    "id": "pukka",
    "name": "普卡",
    "team": "demon",
    "ability": "每个夜晚，你要选择一名玩家：他中毒。 上个因你的能力中毒的玩家会死亡并恢复健康。",
    "firstNightReminder": "让普卡选择一名玩家。标记那名玩家中毒。",
    "otherNightReminder": "让普卡选择一名玩家。标记那名玩家中毒。上一个因普卡中毒的玩家死亡，随后恢复健康。",
    "script": "bmr"
  },
  {
    "id": "shabaloth",
    "name": "沙巴洛斯",
    "team": "demon",
    "ability": "每个夜晚*，你要选择两名玩家：他们死亡。 你上个夜晚选择过且当前死亡的玩家之一可能会被你反刍。",
    "firstNightReminder": "",
    "otherNightReminder": "上一夜被沙巴洛斯选择且当前已死亡的玩家之一可能被反刍，如果被反刍，标记那名玩家被复活。让沙巴洛斯选择两名玩家。标记这两名玩家死亡。",
    "script": "bmr"
  },
  {
    "id": "po",
    "name": "珀",
    "team": "demon",
    "ability": "每个夜晚*，你可以选择一名玩家：他死亡。 如果你上次选择时没有选择任何玩家，当晚你要选择三名玩家：他们死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "珀可以选择一名玩家；或如果上一次他被唤醒时未做选择，让他选择三名玩家。标记这些玩家死亡。",
    "script": "bmr"
  }
]);
 profiles.push(...[
  {
    "id": "banxian",
    "name": "半仙",
    "team": "townsfolk",
    "ability": "任何在夜晚使用自身能力选择你的其他玩家，会改为选中另一名邪恶玩家作为替代。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "bianlianshi",
    "name": "变脸师",
    "team": "townsfolk",
    "ability": "每个白天，如果你“疯狂”地证明自己是一个善良角色（与之前不同），你可能会在当晚获得那个角色的能力，直到下个黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "dagengren",
    "name": "打更人",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要猜测今晚首个死亡的玩家与你的距离。如果你猜测正确，则除你以外的所有玩家今晚不会死亡，但你可能会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒打更人，并让其猜测距离，以数字手势给出。在这两名玩家的角色标记旁放置“警惕”提示标记。在当晚首次有角色死亡时，如果是标记有“警惕”的玩家，那么当晚不会有除打更人外的任何人死亡。同时，如果说书人决定让打更人死亡，则在其角色标记旁放置“死亡”提示标记。在黎明时，移除所有“警惕”标记。",
    "script": "huadeng"
  },
  {
    "id": "dianxiaoer",
    "name": "店小二",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知两名善良玩家。他们之中会有一人醉酒，即使你已死亡。",
    "firstNightReminder": "唤醒店小二，对他指向标记有店小二的“熟客”和“醉酒”提示标记的这两名玩家。",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "geling",
    "name": "歌伶",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在白天时，你可以提议所有玩家观看你的演出，并从同意参加的玩家中选择你的观众。如果恶魔成为了观众，你会在当晚死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果歌伶在白天使用了能力，且恶魔成为了观众，标记伶人死亡。",
    "script": "huadeng"
  },
  {
    "id": "heshang",
    "name": "和尚",
    "team": "townsfolk",
    "ability": "每个夜晚，当有邪恶玩家的能力首次选择或影响与你邻近的存活玩家时，改为此次能力不生效并持续至下个黎明，且你会得知你的能力被触发。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "jinyiwei",
    "name": "锦衣卫",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要选择一名玩家：如果他在下个黄昏前死亡，你代替他死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "移除上个夜晚放置的“保护”标记。唤醒锦衣卫，让其选择一名玩家。在该玩家角色标记旁放置“保护”提示标记。",
    "script": "huadeng"
  },
  {
    "id": "langzhong",
    "name": "郎中",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择除你以外的一名玩家：你会得知一个与他能力相关的词语。",
    "firstNightReminder": "唤醒郎中，让其指向一名玩家。以不会被其他玩家察觉的形式对其提供与该玩家角色能力相关的一个词语。",
    "otherNightReminder": "唤醒郎中，让其指向一名玩家。以不会被其他玩家察觉的形式对其提供与该玩家角色能力相关的一个词语。",
    "script": "huadeng"
  },
  {
    "id": "qintianjian",
    "name": "钦天监",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知离你最近的邪恶玩家位于你的哪一侧（左/右/相同）。如果与你邻近的玩家中有邪恶阵营，你会得知错误信息作为替代。",
    "firstNightReminder": "唤醒钦天监，对其用拇指指向其左侧或右侧示意。如果两侧邪恶玩家与他距离相同，拇指朝下示意。",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "wudaozhe",
    "name": "悟道者",
    "team": "townsfolk",
    "ability": "你以为你是一个外来者，但你实际上不是。如果有邪恶玩家的能力选择或影响了你，你会立即变成一个不在场的镇民角色。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "xizi",
    "name": "戏子",
    "team": "townsfolk",
    "ability": "所有戏子互相认识。不论在场的戏子数量多少或存活与否，胜负结果会被对调。[所有善良玩家都是戏子]",
    "firstNightReminder": "唤醒所有戏子，让他们互相确认。如有必要，对他们展示“你是”提示标记和戏子角色标记。",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "yinyangshi",
    "name": "阴阳师",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知两个善良角色和两个邪恶角色，其中有且只有两个角色在场。",
    "firstNightReminder": "唤醒阴阳师，并对其展示两个善良角色，两个邪恶角色，共四个角色标记。其中正好只有两个角色在场。",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "xionghaizi",
    "name": "熊孩子",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择一个镇民角色：他的能力会产生错误信息，直到下个黄昏。",
    "firstNightReminder": "唤醒熊孩子，让其选择一个镇民角色。如果该角色在场，在对应角色标记旁放置“捣蛋”提示标记。",
    "otherNightReminder": "移除上个夜晚放置的“捣蛋”提示标记。唤醒熊孩子，让其选择一个镇民角色。如果该角色在场，在对应角色标记旁放置“捣蛋”提示标记。",
    "script": "huadeng"
  },
  {
    "id": "nichen",
    "name": "逆臣",
    "team": "outsider",
    "ability": "在你的首个夜晚，你要选择除你以外的一名玩家：如果他先死于处决，你会在当晚转变为邪恶；如果你先死于处决，他会在当晚转变为邪恶。",
    "firstNightReminder": "唤醒逆臣，让其选择一名玩家。在该玩家的角色标记旁放置“不共戴天”提示标记。",
    "otherNightReminder": "如果逆臣或标记了“不共戴天”的玩家死于处决，唤醒两者之中的另一名玩家，告诉他变为邪恶阵营。",
    "script": "huadeng"
  },
  {
    "id": "shaxing",
    "name": "煞星",
    "team": "outsider",
    "ability": "如果你死亡，当晚与你邻近的存活玩家之一可能会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果天花病人死亡，将与其邻近的存活善良玩家之一标记为死亡。",
    "script": "huadeng"
  },
  {
    "id": "shijie",
    "name": "使节",
    "team": "outsider",
    "ability": "每个夜晚限一次，一名玩家在使用自身能力选择邪恶玩家时会改为选中你，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "shusheng",
    "name": "书生",
    "team": "outsider",
    "ability": "恶魔知道书生在场。每局游戏限一次，恶魔可以拜访说书人并猜测你是书生。如果恶魔猜测正确，即使你已死亡，当晚该恶魔可以选择一名玩家：他死亡。",
    "firstNightReminder": "唤醒恶魔，并对他展示“该角色的能力对你触发”提示标记与书生角色标记。",
    "otherNightReminder": "如果白天恶魔成功猜中了书生是谁，唤醒那个恶魔，让其选择一名玩家。标记那名玩家死亡。",
    "script": "huadeng"
  },
  {
    "id": "ganshiren",
    "name": "赶尸人",
    "team": "minion",
    "ability": "与你邻近的两名镇民玩家会在其首次死亡时被当作仍然存活。[-1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "humeiniang",
    "name": "狐媚娘",
    "team": "minion",
    "ability": "在你的首个夜晚，你要选择一名玩家：他会知道狐媚娘在场。如果你死于处决，当晚他转变为邪恶阵营。",
    "firstNightReminder": "唤醒狐媚娘，让她选择一名玩家。标记那名玩家“被魅惑”。随后唤醒那名玩家，对他展示“该角色的能力对你触发”和狐媚娘角色标记。",
    "otherNightReminder": "如果今日狐媚娘死于处决，且被魅惑的玩家为善良阵营，唤醒被魅惑的玩家，对他展示“你是”和朝下的大拇指。",
    "script": "huadeng"
  },
  {
    "id": "jinweijun",
    "name": "禁卫军",
    "team": "minion",
    "ability": "“疯狂”地想要死亡的玩家可能会立即被处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "yangguren",
    "name": "养蛊人",
    "team": "minion",
    "ability": "在你存活时提名你的玩家会在当晚死亡，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果有玩家被放置了“提名”标记，标记该玩家死亡。",
    "script": "huadeng"
  },
  {
    "id": "hundun",
    "name": "混沌",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。如果你以这种方式杀死了一名与你邻近的镇民玩家，除旅行者外的所有善良玩家会中毒直到下个黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "让混沌选择一名玩家。标记那名玩家死亡。如果混沌成功杀死了与自己邻近的一名镇民玩家，在魔典中央放置混沌的“善良中毒”提示标记。",
    "script": "huadeng"
  },
  {
    "id": "hundun_all_good",
    "iconRoleId": "hundun",
    "name": "混沌",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。如果你以这种方式杀死了一名与你邻近的镇民玩家，所有善良玩家会中毒直到下个黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "让混沌选择一名玩家，记录实际死亡结果。如果混沌以这种方式杀死了与自己邻近的一名镇民玩家，所有善良玩家中毒直到下个黄昏。",
    "script": "huadeng"
  },
  {
    "id": "qiongqi",
    "name": "穷奇",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。如果今天白天有外来者死亡，当晚改为你要选择一名玩家：他死亡，但被当作仍然存活，随后会有一名其他玩家死亡。[+1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "每个白天，如果有外来者死亡，将穷奇的“死于今日”提示标记放置到该玩家的角色标记旁。\n除了首个夜晚外的每个夜晚，唤醒穷奇，并让他指向任意一名玩家。让穷奇重新入睡。\n如果穷奇的“死于今日”提示标记未被放置，那么穷奇选择的玩家死亡，在他角色标记旁放置“死亡”提示标记。\n如果穷奇的“死于今日”提示标记已被放置，且穷奇选择的玩家当前处于存活状态，并能够成功被穷奇杀死，那么穷奇选择的玩家进入“活尸”状态。在魔典中该玩家的角色标记上添加帷幕标记，但不要在黎明时宣布该玩家已经死亡，也不要在城镇广场上将该玩家的生命标记翻面。随后，再在任意一名玩家的角色标记旁放置“死亡”提示标记。\n在黎明时，移除“死于今日”提示标记，并宣布当晚放置了穷奇的“死亡”提示标记的玩家死亡。",
    "script": "huadeng"
  },
  {
    "id": "taotie",
    "name": "饕餮",
    "team": "demon",
    "ability": "每个夜晚*，你要选择任意数量的非旅行者玩家或一名旅行者玩家：如果他们的角色类型均不相同，他们死亡。[+1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒饕餮，让其选择任意数量的玩家。如果这些玩家的角色类型均不相同，标记这些玩家死亡。",
    "script": "huadeng"
  },
  {
    "id": "taowu",
    "name": "梼杌",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。当你将要死亡时，改为一名存活且具有能力的爪牙失去能力。你不会得知恶魔信息。",
    "firstNightReminder": "在游戏中的首个夜晚，将要唤醒恶魔提供恶魔信息时，不要唤醒梼杌。",
    "otherNightReminder": "唤醒梼杌，并让他指向任意一名玩家。让梼杌重新入睡。被梼杌选择的玩家死亡，在他角色标记旁放置“死亡”提示标记。\n任何时候梼杌即将死亡时，如果场上有爪牙存活，且该爪牙的角色标记旁未放置任何“中毒”、“醉酒”、“失去能力”等导致爪牙失去能力的标记时，选择一名满足上述条件的爪牙，在该爪牙的角色标记旁放置梼杌的“失去能力”标记。梼杌不会因此死亡。",
    "script": "huadeng"
  },
  {
    "id": "gnome",
    "name": "侏儒",
    "team": "traveller",
    "ability": "当你加入游戏时，所有玩家会得知一名与你阵营相同的玩家。每当他被提名时，你可以杀死提名者。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "gangster",
    "name": "黑帮",
    "team": "traveller",
    "ability": "每个白天限一次，你可以杀死与你邻近的两名存活的玩家中的一名，但需要另一边那个存活的玩家同意。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "jiaohuazi",
    "name": "叫花子",
    "team": "traveller",
    "ability": "每个白天限一次，你可以公开选择一名其他玩家，让他选择一个非恶魔角色：你可能会获得这个角色的能力，直到下个黎明。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "huadeng"
  },
  {
    "id": "diaomin",
    "name": "刁民",
    "team": "traveller",
    "ability": "曾在白天粗暴地打断过你的发言的玩家之一会在当晚醉酒，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果有人在白天粗暴地打断过刁民的发言，选择让他们当中的一个醉酒，即使刁民已死亡。",
    "script": "shanyu"
  },
  {
    "id": "bingbi",
    "name": "秉笔",
    "team": "townsfolk",
    "ability": "如果你在白天死亡，当晚你会得知一名善良玩家。 如果你在夜晚死亡，当晚你会得知一名邪恶玩家。",
    "firstNightReminder": "",
    "otherNightReminder": "如果秉笔人在夜晚死去，唤醒他并指向一名邪恶玩家；如果秉笔在白天死去，唤醒他并指向一名善良玩家。随后让他重新入睡。",
    "script": "shanyu"
  },
  {
    "id": "chongfei",
    "name": "宠妃",
    "team": "townsfolk",
    "ability": "每局游戏限一次，说书人会在关于你的事情上打破规则。随后，你会秘密得知说书人为此做了什么。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "shanyu"
  },
  {
    "id": "daoke",
    "name": "刀客",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你得知一个在场的爪牙角色。每局游戏限一次，你可以在白天公开选择一名玩家：如果他是你得知的角色，他死亡。",
    "firstNightReminder": "在为首个夜晚做准备时，将刀客的“追杀”标记放置在一个爪牙角色标记旁。\n在首个夜晚，唤醒刀客。对他展示标记了“追杀”的爪牙角色标记。让刀客重新入睡。",
    "otherNightReminder": "",
    "script": "shanyu"
  },
  {
    "id": "daoshi",
    "name": "道士",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要选择一名玩家：如果你选中了恶魔，你死亡，然后他醉酒直到下个黎明。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒道士，让其选择一名玩家。如果他选中了恶魔，在他的角色标记旁放置“死亡”提示标记。",
    "script": "shanyu"
  },
  {
    "id": "fangshi",
    "name": "方士",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你要选择一个数字。 在该数字对应的那一个夜晚，你会得知对应数量的在场角色。",
    "firstNightReminder": "唤醒方士，让其选择一个数字，将对应数字的标记放置在方士角色标记旁边。如果他选择了1，向他展示一个在场角色的标记。",
    "otherNightReminder": "在游戏的对应天数唤醒方士，向他展示对应数量的在场角色的标记。",
    "script": "shanyu"
  },
  {
    "id": "fengshuishi",
    "name": "风水师",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知一名玩家的角色类型。每个夜晚*，你会从他的顺时针方向得知下一名非旅行者玩家的角色类型。",
    "firstNightReminder": "在首个夜晚，唤醒风水师，告知他“标记”提示标记旁的玩家角色类型，并将标记顺时针移动一名玩家。",
    "otherNightReminder": "唤醒风水师，告知他“标记”提示标记旁的玩家角色类型，并将标记顺时针移动一名玩家。",
    "script": "shanyu"
  },
  {
    "id": "limao",
    "name": "狸猫",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要选择一名玩家：如果他是善良角色且当晚被邪恶角色杀死，你和他交换角色。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒狸猫，让他指向一名玩家。让狸猫重新入睡。将“太子”标记放在对应玩家角色标记旁。\n如果标记太子的玩家死亡，在魔典中交换狸猫和太子的角色标记。在新的交换后的角色旁放置“醉酒”提示标记。唤醒新的狸猫并依次向他展示“你是”信息标记、狸猫的角色标记。让狸猫重新入睡。唤醒原来的狸猫并依次向他展示“你是”信息标记，“太子”的角色标记。",
    "script": "shanyu"
  },
  {
    "id": "qianke",
    "name": "掮客",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择两名存活玩家：如果他们阵营相同，今晚任何玩家使用自身能力选择他们之一作为目标时，改为选中另一名玩家。",
    "firstNightReminder": "唤醒掮客，让他指向两名存活玩家。如果这两名玩家阵营相同，在这些玩家的角色标记旁放置“熟客”提示标记。",
    "otherNightReminder": "移除上个夜晚放置的“熟客”标记。唤醒车夫，让他指向两名存活玩家。如果这两名玩家阵营相同，在这些玩家的角色标记旁放置“熟客”提示标记。",
    "script": "shanyu"
  },
  {
    "id": "ranfangfangzhu",
    "name": "染坊坊主",
    "team": "townsfolk",
    "ability": "如果你在夜晚死亡，恶魔的能力变成“每个夜晚*，可能会有一名玩家死亡。”",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "shanyu"
  },
  {
    "id": "shiguan",
    "name": "史官",
    "team": "townsfolk",
    "ability": "每个夜晚*，如果今天白天有玩家死于处决，你会得知存活镇民的数量。",
    "firstNightReminder": "",
    "otherNightReminder": "如果白天有玩家死于处决，唤醒史官并展示数字手势来告诉他存活镇民数量。",
    "script": "shanyu"
  },
  {
    "id": "tixingguan",
    "name": "提刑官",
    "team": "townsfolk",
    "ability": "在你首次提名玩家后，你会在当晚得知他的角色。恶魔会被你的能力当作善良角色。",
    "firstNightReminder": "",
    "otherNightReminder": "在提刑官首次提名后的当晚，唤醒提刑官，告知被其提名的玩家的角色。",
    "script": "shanyu"
  },
  {
    "id": "xuncha",
    "name": "巡察",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要选择两个善良角色（与上个夜晚都不同）：如果他们都存活，他们当晚不会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒巡查，让其选择两个善良角色，如果这两个角色都在场，在对应玩家角色标记旁放置“不会死亡”标记。",
    "script": "shanyu"
  },
  {
    "id": "yanshi",
    "name": "偃师",
    "team": "townsfolk",
    "ability": "如果你在夜晚死亡，你与一名存活爪牙玩家交换角色。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "shanyu"
  },
  {
    "id": "xizi_revised",
    "name": "戏子(改)",
    "team": "townsfolk",
    "ability": "其他善良玩家醉酒（旅行者除外），你们互相认识且无法转变阵营，对调胜负结果，即使你失去能力。",
    "firstNightReminder": "在第一个夜晚“爪牙信息”与“恶魔信息”步骤之后，同时唤醒所有除了旅行者以外的善良玩家，让他们互认。如有必要，可以向他们展示“该角色的能力对你生效”信息标记并展示戏子（改）角色标记。然后让他们重新入睡。游戏结束时，将胜负结果对调后再宣布获胜阵营。",
    "otherNightReminder": "",
    "script": "shanyu"
  },
  {
    "id": "yishi",
    "name": "驿使",
    "team": "townsfolk",
    "ability": "每个白天，你可以公开声明一个角色在场。在当晚，你会得知该声明是否正确。 如果你得知过是和否，你失去此能力。",
    "firstNightReminder": "",
    "otherNightReminder": "在每个白天，如果驿使声明使用他的能力，如果驿使声明的角色在场，放置“猜测正确”提示标记在驿使角色标记旁。\n当晚，唤醒驿使艺人。如果他猜测正确，对他点头表示“是”，对他摇头表示“否”，如果你对他摇头，放置一枚“失去能力”的标记在其角色旁",
    "script": "shanyu"
  },
  {
    "id": "yinluren",
    "name": "引路人",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择除你以外的至多三名玩家：你会得知今晚是否有邪恶玩家的能力选择或影响了他们之中的玩家。",
    "firstNightReminder": "唤醒引路人，让其选择至多三名玩家。以点头或摇头作为信息给出。",
    "otherNightReminder": "唤醒引路人，让其选择至多三名玩家。以点头或摇头作为信息给出。",
    "script": "shanyu"
  },
  {
    "id": "yongjiang",
    "name": "俑匠",
    "team": "townsfolk",
    "ability": "如果已死亡玩家中没有邪恶玩家，你只会死于处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "shanyu"
  },
  {
    "id": "zhen",
    "name": "鸩",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一个镇民角色：如果他在场，他中毒并死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒鸩，让其选择一个镇民角色，如果该角色在场，在其角色标记旁放置“死亡”和“醉酒”提示标记",
    "script": "shanyu"
  },
  {
    "id": "zhifu",
    "name": "知府",
    "team": "townsfolk",
    "ability": "每个夜晚*，你会得知今天是否有非镇民且非旅行者的玩家死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果在白天以及夜晚，只有镇民或旅行者玩家死亡，对知府摇头表示“否”，否则点头表示“是”。",
    "script": "shanyu"
  },
  {
    "id": "jiubao",
    "name": "酒保",
    "team": "outsider",
    "ability": "与你邻近的善良玩家（旅行者除外）之一醉酒，即使你死于处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "shanyu"
  },
  {
    "id": "rulianshi",
    "name": "入殓师",
    "team": "outsider",
    "ability": "如果你提名了恶魔且他死于这次处决，你会变成那个邪恶的恶魔。当剩余存活玩家小于等于四人时（旅行者除外），你失去能力。",
    "firstNightReminder": "",
    "otherNightReminder": "如果白天入殓师提名了恶魔且恶魔被处决，唤醒他，并对他展示“你是”提示标记和恶魔角色标记。",
    "script": "shanyu"
  },
  {
    "id": "shutong",
    "name": "书童",
    "team": "outsider",
    "ability": "在你的首个夜晚，你要选择除你以外的一名玩家：除首个夜晚以外，当他被邪恶玩家的能力选择或影响时，你会在当晚死亡。",
    "firstNightReminder": "唤醒书童，让其选择一名玩家，在其选择的玩家标记旁放置“选择”。",
    "otherNightReminder": "如果标记有“选择”的玩家被邪恶玩家的能力选择或影响时，在书童旁放置“死亡”标记。",
    "script": "shanyu"
  },
  {
    "id": "huapi",
    "name": "画皮",
    "team": "minion",
    "ability": "在你的首个夜晚，你要选择一名存活玩家：他死亡但会被当作存活。 当他下一次即将死亡时，他重生，随后你重获能力。",
    "firstNightReminder": "首个夜晚，唤醒画皮，让其选择一名玩家，该玩家进入“活尸”状态。在魔典中该玩家的角色标记上添加帷幕标记，和“以为存活”标记。但不要宣布该玩家已经死亡，也不要在城镇广场上将该玩家的生命标记翻面。",
    "otherNightReminder": "如果画皮选择的玩家重生，在画皮的角色标记旁放置“重获能力”标记。\n每个夜晚，如果画皮有“重获能力”标记，唤醒画皮，让其选择一名玩家，该玩家进入“活尸”状态。在魔典中该玩家的角色标记上添加帷幕标记，和“以为存活”标记。但不要宣布该玩家已经死亡，也不要在城镇广场上将该玩家的生命标记翻面。",
    "script": "shanyu"
  },
  {
    "id": "gudiao",
    "name": "蛊雕",
    "team": "minion",
    "ability": "每个夜晚，你会得知顺时针方向上的下一名存活的镇民玩家的角色，他中毒且可能被当作邪恶的蛊雕，直到下个黄昏。 每局游戏限一次，在夜晚时，你可以改变方向。",
    "firstNightReminder": "唤醒蛊雕，让其选择一个方向。将他的“中毒”标记移动至那个方向上的下一个存活玩家的角色标记旁。随后对他指向那名玩家，并展示“他是”提示标记和该玩家的角色标记。",
    "otherNightReminder": "唤醒蛊雕，让其选择一个方向。将他的“中毒”标记移动至那个方向上的下一个存活玩家的角色标记旁。随后对他指向那名玩家，并展示“他是”提示标记和该玩家的角色标记。",
    "script": "shanyu"
  },
  {
    "id": "jinweijun2",
    "name": "禁卫军2",
    "team": "minion",
    "ability": "在你的首个夜晚，你要选择存活或死亡。“疯狂”地想要这样做的玩家可能会立即被处决。",
    "firstNightReminder": "唤醒禁卫军，给他展示“求生”和“求死”标记，让其选择一枚，并让他重新入睡。",
    "otherNightReminder": "",
    "script": "shanyu"
  },
  {
    "id": "mengpo",
    "name": "孟婆",
    "team": "minion",
    "ability": "每个夜晚*，你可以选择一名存活玩家，他要二选一：1）能力描述修改为“你没有能力。”；2）死亡并保留能力直到下个黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒孟婆，让其选择一名玩家，随后让孟婆闭眼。唤醒孟婆选择的玩家，依次向他展示“该角色的能力对你生效”信息标记、孟婆的角色标记，随后让其用点头或者摇头来表示想要生死。如果其点头，放置“失去能力”标记，如果其摇头，放置“保留能力”标记。",
    "script": "shanyu"
  },
  {
    "id": "niangjiushi",
    "name": "酿酒师",
    "team": "minion",
    "ability": "每个夜晚，你要选择一个镇民角色：当他下一次通过自身能力获取信息时，改为得知你给出的信息。",
    "firstNightReminder": "唤醒酿酒师，让其选择一个角色并给出该角色对应的信息形式。如果该角色在场，在对应的角色标记旁放置“微醺”提示标记。如有必要，记录下该信息形式作为备忘，但不要将这一信息展示给任何能查看魔典的玩家。",
    "otherNightReminder": "唤醒酿酒师，让其选择一个角色并给出该角色对应的信息形式。如果该角色在场，在对应的角色标记旁放置“微醺”提示标记。如有必要，记录下该信息形式作为备忘，但不要将这一信息展示给任何能查看魔典的玩家。",
    "script": "shanyu"
  },
  {
    "id": "baojun",
    "name": "暴君",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。 如果你杀死了与爪牙邻近的玩家，下个夜晚你可以选择至多两名玩家：他们死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒暴君，让其选择至多两名玩家。在这些玩家角色标记旁放置“死亡”提示标记。如果暴君选择的玩家数量与上个夜晚死亡的玩家数量相同，摇头示意其重新选择",
    "script": "shanyu"
  },
  {
    "id": "dianyuzhang",
    "name": "典狱长",
    "team": "demon",
    "ability": "每个夜晚，你要选择至多三名玩家：如果明天白天他们之一死于处决，上次被你选择的其他玩家会在当晚死亡。否则，当晚他们之中会有一名玩家死亡。",
    "firstNightReminder": "唤醒典狱长，让其选择至多三名玩家。在这些玩家角色标记旁放置“囚禁”提示标记。",
    "otherNightReminder": "如果今天白天被处决的玩家标记有“囚禁”，则其他标记有囚禁的玩家死亡。否则，将其中一人标记为死亡。移除所有“囚禁”提示标记。唤醒典狱长，让其选择至多三名玩家。在这些玩家角色标记旁放置“囚禁”提示标记。",
    "script": "shanyu"
  },
  {
    "id": "guhuoniao",
    "name": "姑获鸟",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。每局游戏限一次，当爪牙死于处决时，你可能会获得他的能力。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒姑获鸟，让其选择一名玩家，在玩家角色标记旁放置“死亡”提示标记。",
    "script": "shanyu"
  },
  {
    "id": "jianning",
    "name": "奸佞",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。爪牙在其死亡的当晚要选择一名玩家：如果他是善良的，他死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒奸佞，让其选择一名玩家。如果白天奸佞未投票，改为让其选择两名玩家。标记他选择的玩家死亡。",
    "script": "shanyu"
  },
  {
    "id": "yanluo",
    "name": "阎罗",
    "team": "demon",
    "ability": "在你的首个夜晚，你能查看魔典并选择一名玩家：他在第三个夜晚死亡，即使因为任何原因让他不会死亡。每个夜晚，你要选择一名玩家：上个夜晚被你选择的玩家死亡。",
    "firstNightReminder": "首个夜晚，唤醒阎罗并让他按自己意愿的时长来查看魔典。让阎罗选择两名玩家，放置“即将死亡”标记在其角色图标旁。",
    "otherNightReminder": "让阎罗选择一名玩家，放置“即将死亡”标记在其角色图标旁。",
    "script": "shanyu"
  },
  {
    "id": "lycanthrope",
    "name": "半兽人",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要选择一名存活玩家：如果他是善良的，他死亡，并且当晚恶魔不会造成死亡。 会有一名善良玩家始终被当作邪恶阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "半兽人指向一名存活玩家：如果那名玩家善良，立刻死去且当晚恶魔不会造成死亡。",
    "script": "experimental"
  },
  {
    "id": "banshee",
    "name": "报丧女妖",
    "team": "townsfolk",
    "ability": "如果恶魔杀死了你，所有玩家都会得知此事。从现在开始，你每天可以发起两次提名，每次投票时可以投两票。",
    "firstNightReminder": "",
    "otherNightReminder": "如果恶魔杀死了报丧女妖，高声宣布“报丧女妖觉醒了！”或发出奇怪的声音，并使用“具有能力”标记报丧女妖。",
    "script": "experimental"
  },
  {
    "id": "choirboy",
    "name": "唱诗男孩",
    "team": "townsfolk",
    "ability": "如果恶魔杀死了国王，你会得知哪名玩家是恶魔。[+国王]",
    "firstNightReminder": "",
    "otherNightReminder": "如果国王被恶魔杀死，将唱诗男孩唤醒并告诉他谁是那个杀死国王的恶魔。",
    "script": "experimental"
  },
  {
    "id": "preacher",
    "name": "传教士",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择一名玩家：如果你选中了爪牙，他会得知被传教士选中。 所有被你选中的爪牙失去能力。",
    "firstNightReminder": "传教士选择一名玩家。如果选中了爪牙，则唤醒并告知他被传教士选中。",
    "otherNightReminder": "传教士选择一名玩家。如果选中了爪牙，则唤醒并告知他被传教士选中。",
    "script": "experimental"
  },
  {
    "id": "villageidiot",
    "name": "村夫",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择一名玩家：你会得知他的阵营。[+0~2村夫，复数村夫中有一人醉酒]",
    "firstNightReminder": "让村夫指向一名玩家，根据对方的阵营，对他给出拇指向上或向下的手势。",
    "otherNightReminder": "让村夫指向一名玩家，根据对方的阵营，对他给出拇指向上或向下的手势。",
    "script": "experimental"
  },
  {
    "id": "engineer",
    "name": "工程师",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时，你可以选择让恶魔变成你选择的恶魔角色，或让所有爪牙变成你选择的爪牙角色。",
    "firstNightReminder": "唤醒工程师，他可以摇头不使用能力，或选择角色列表上的恶魔或爪牙角色，来执行同角色类型的这些玩家的角色变化。",
    "otherNightReminder": "如果工程师未曾使用能力，唤醒工程师，他可以摇头不使用能力，或选择角色列表上的恶魔或爪牙角色，来执行同角色类型的这些玩家的角色变化。",
    "script": "experimental"
  },
  {
    "id": "noble",
    "name": "贵族",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知三名玩家：其中有且只有一名玩家是邪恶的。",
    "firstNightReminder": "以任意顺序指向三名玩家，其中一名邪恶。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "king",
    "name": "国王",
    "team": "townsfolk",
    "ability": "每个夜晚，如果死亡的玩家数量大于或等于存活的玩家数量，你会得知一个存活的角色。 恶魔知道你是国王。",
    "firstNightReminder": "唤醒恶魔，并告诉他国王是谁。",
    "otherNightReminder": "如果死亡玩家人数大于存活玩家，唤醒国王并对其展示一个存活的角色标记。",
    "script": "experimental"
  },
  {
    "id": "general",
    "name": "将军",
    "team": "townsfolk",
    "ability": "每个夜晚，你会得知说书人认为哪个阵营当前更有优势（善良/邪恶/均势）。",
    "firstNightReminder": "告诉将军你认为的答案。",
    "otherNightReminder": "告诉将军你认为的答案。",
    "script": "experimental"
  },
  {
    "id": "alchemist",
    "name": "炼金术士",
    "team": "townsfolk",
    "ability": "你拥有一个爪牙角色的能力。当你使用能力时，说书人可能会要求你更换选择。",
    "firstNightReminder": "唤醒炼金术士，对他展示他获得的能力所对应的爪牙角色标记。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "magician",
    "name": "魔术师",
    "team": "townsfolk",
    "ability": "恶魔会以为你是爪牙。爪牙会以为你是恶魔。",
    "firstNightReminder": "如果魔术师在场，则需要对爪牙信息环节和恶魔信息环节的相关内容进行调整。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "farmer",
    "name": "农夫",
    "team": "townsfolk",
    "ability": "当你在夜晚死亡时，一名存活的善良玩家会变成农夫。",
    "firstNightReminder": "",
    "otherNightReminder": "如果农民在夜晚死去，则选择另一位善良玩家成为农民。唤醒这名玩家，并告知他成为了农民。",
    "script": "experimental"
  },
  {
    "id": "highpriestess",
    "name": "女祭司",
    "team": "townsfolk",
    "ability": "每个夜晚，你会得知一名说书人认为你最应该与其交流的玩家。",
    "firstNightReminder": "唤醒女祭司，指向一名玩家。让女祭司重新入睡。",
    "otherNightReminder": "唤醒女祭司，指向一名玩家。让女祭司重新入睡。",
    "script": "experimental"
  },
  {
    "id": "knight",
    "name": "骑士",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知两名非恶魔玩家。",
    "firstNightReminder": "唤醒骑士，对他指向两名非恶魔玩家。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "balloonist",
    "name": "气球驾驶员",
    "team": "townsfolk",
    "ability": "每个夜晚，你会得知一名与上个夜晚得知的玩家角色类型不同的玩家。[+0~1外来者]",
    "firstNightReminder": "选择一种角色类型，并告知其一个符合该类型的玩家。在该玩家旁边标记已被知晓。",
    "otherNightReminder": "选择一种与气球驾驶员上个夜晚知晓的角色类型不同的，并告知其一个符合该类型的玩家。",
    "script": "experimental"
  },
  {
    "id": "bounty_hunter",
    "name": "赏金猎人",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知一名邪恶玩家。 每当你得知的玩家死亡，你会在当晚得知另一名邪恶玩家。[会有一名镇民转变为邪恶阵营]",
    "firstNightReminder": "指向一名邪恶玩家。随后唤醒那名因赏金猎人而转变为邪恶的镇民，并告知他变成了邪恶阵营。",
    "otherNightReminder": "如果赏金猎人知晓的邪恶玩家死亡，指向另一名邪恶玩家。",
    "script": "experimental"
  },
  {
    "id": "amnesiac",
    "name": "失忆者",
    "team": "townsfolk",
    "ability": "你不知道你的能力是什么。每个白天你可以找说书人猜测一次，你会得知你的猜测有多准确。",
    "firstNightReminder": "决定失忆者的能力。如果失忆者的能力会让他在今晚醒来：唤醒他并执行其能力。",
    "otherNightReminder": "如果失忆者的能力会让他在今晚醒来：唤醒他并执行其能力。",
    "script": "experimental"
  },
  {
    "id": "cannibal",
    "name": "食人族",
    "team": "townsfolk",
    "ability": "你拥有上个死于处决的玩家的能力。如果该玩家属于邪恶阵营，你中毒直到下个善良玩家死于处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "steward",
    "name": "事务官",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知一名善良玩家。",
    "firstNightReminder": "唤醒事务官，对他指向一名善良玩家。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "nightwatchman",
    "name": "守夜人",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时，你可以选择一名玩家：他会得知你是守夜人。",
    "firstNightReminder": "守夜人可以指向一名玩家。如果他这么做，则唤醒那名玩家，告知其被守夜人选中，且告知他守夜人是谁。",
    "otherNightReminder": "守夜人可以指向一名玩家。如果他这么做，则唤醒那名玩家，告知其被守夜人选中，且告知他守夜人是谁。",
    "script": "experimental"
  },
  {
    "id": "atheist",
    "name": "无神论者",
    "team": "townsfolk",
    "ability": "说书人可以打破游戏规则，如果说书人被处决，善良阵营获胜，即使你已死亡。[无邪恶角色在场]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "alsaahir",
    "name": "戏法师",
    "team": "townsfolk",
    "ability": "每个白天，你可以公开进行一次谁是爪牙，谁是恶魔的猜测。如果你猜对，善良阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "pixie",
    "name": "小精灵",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知一个在场的镇民角色。如果你“疯狂”地证明你是该角色，当他死亡时你获得该角色的能力。",
    "firstNightReminder": "对小精灵展示一个在场的镇民角色。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "shugenja",
    "name": "修行者",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知距离最近的邪恶玩家位于你的顺时针还是逆时针方向。如果两侧的邪恶玩家与你距离相等，你得知的信息由说书人决定。",
    "firstNightReminder": "唤醒修行者，对他指向对应方向来告知他最近的邪恶玩家的方向。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "huntsman",
    "name": "巡山人",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时，你可以选择一名存活的玩家：如果你选中了落难少女，她会变成一个不在场的镇民角色。[+落难少女]",
    "firstNightReminder": "唤醒巡山人，他可以摇头不使用能力，或选择一名玩家。如果巡山人选中了落难少女，则在巡山人入睡后通知落难少女角色变化。",
    "otherNightReminder": "如果巡山人未曾使用能力，唤醒巡山人，他可以摇头不使用能力，或选择一名玩家。如果巡山人选中了落难少女，则在巡山人入睡后通知落难少女角色变化。",
    "script": "experimental"
  },
  {
    "id": "cult_leader",
    "name": "异教领袖",
    "team": "townsfolk",
    "ability": "每个夜晚，你会转变为与你邻近的一名存活的玩家的阵营。 每个白天，你可以提议所有玩家加入你的教派，如果所有善良玩家同意加入，你的阵营获胜。",
    "firstNightReminder": "如果异教领袖改变了阵营，告诉他。",
    "otherNightReminder": "如果异教领袖改变了阵营，告诉他。",
    "script": "experimental"
  },
  {
    "id": "poppy_grower",
    "name": "罂粟种植者",
    "team": "townsfolk",
    "ability": "爪牙和恶魔互相不认识。如果你死亡，当晚他们会互相认识。",
    "firstNightReminder": "不要让恶魔和爪牙相认。",
    "otherNightReminder": "如果罂粟种植者死亡，安排恶魔和爪牙相认环节。",
    "script": "experimental"
  },
  {
    "id": "fisherman",
    "name": "渔夫",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在白天时，你可以让说书人给你一些能帮助你的阵营获胜的建议。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "acrobat",
    "name": "杂技演员",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要选择一名玩家：如果当晚他醉酒或中毒，你死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果杂技演员选择的玩家中毒或醉酒，杂技演员死亡。",
    "script": "experimental"
  },
  {
    "id": "snitch",
    "name": "告密者",
    "team": "outsider",
    "ability": "爪牙会在其首个夜晚得知三个伪装。",
    "firstNightReminder": "分别给爪牙们展示三个不在场角色，这些信息之间，包括与展示给恶魔的不在场角色之间可能会有重叠。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "puzzlemaster",
    "name": "解谜大师",
    "team": "outsider",
    "ability": "一名玩家醉酒，即使你已死亡。每局游戏限一次，你可以猜测谁是那个醉酒的玩家，如果猜对了，你会得知谁是恶魔，但如果猜错了，你会得知错误的“谁是恶魔”信息。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "zealot",
    "name": "狂热者",
    "team": "outsider",
    "ability": "如果有大于等于五名玩家存活，你必须在所有提名中投票。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "damsel",
    "name": "落难少女",
    "team": "outsider",
    "ability": "所有爪牙都知道落难少女在场。每局游戏限一次，任意爪牙可以公开猜测你是落难少女，如果猜对，你的阵营落败。",
    "firstNightReminder": "如果落难少女在场，对爪牙展示落难少女角色标记。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "hatter",
    "name": "帽匠",
    "team": "outsider",
    "ability": "如果你死亡，当晚爪牙和恶魔玩家可以选择变成新的爪牙和恶魔角色。",
    "firstNightReminder": "",
    "otherNightReminder": "在当晚，一同唤醒所有爪牙和恶魔。对他们展示“该角色的能力对你生效”信息标记，然后展示帽匠角色标记。每名以此被唤醒的玩家可以选择摇头或指向角色列表上与自己当前角色类型相同的一个角色。如果一名玩家在做出自己的选择后会使得自己的角色与一名其他玩家选择的角色相同，对他摇头示意他重新选择。在选择完成后让他重新入睡。移除“今晚茶会”提示标记。根据这些玩家的选择，在魔典上执行相应的角色变化操作。",
    "script": "experimental"
  },
  {
    "id": "golem",
    "name": "魔像",
    "team": "outsider",
    "ability": "每局游戏你只能发起提名一次。当你发起提名时，如果被你提名的玩家不是恶魔，他死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "ogre",
    "name": "食人魔",
    "team": "outsider",
    "ability": "在你的首个夜晚，你要选择除你以外的一名玩家：你转变为他的阵营，即使你已醉酒或中毒，但你不知道你转变后的阵营。",
    "firstNightReminder": "在首个夜晚，唤醒食人魔。让食人魔指向一名玩家。让食人魔重新入睡。如果食人魔指向了一名邪恶玩家，将食人魔的角色标记倒转放置，代表食人魔现在属于邪恶阵营。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "plague_doctor",
    "name": "瘟疫医生",
    "team": "outsider",
    "ability": "当你死亡时，说书人会获得一个爪牙能力。",
    "firstNightReminder": "",
    "otherNightReminder": "当瘟疫医生死亡时，将一个不在场的爪牙角色标记放置在魔典左侧的正中位置，并用瘟疫医生的“说书人能力”标记标记该爪牙角色。如可能，在夜晚顺序表旁添加相应的夜晚标记用以提示。",
    "script": "experimental"
  },
  {
    "id": "heretic",
    "name": "异端分子",
    "team": "outsider",
    "ability": "对调胜负结果，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "politician",
    "name": "政客",
    "team": "outsider",
    "ability": "如果你是对你的阵营落败负最大责任的人，你转变阵营并获胜，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "goblin",
    "name": "哥布林",
    "team": "minion",
    "ability": "如果你在被提名后公开声明自己是哥布林且在那个白天被处决，你的阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "widow",
    "name": "寡妇",
    "team": "minion",
    "ability": "在你的首个夜晚，你能查看魔典并选择一名玩家：他中毒。随后，始终会有一名善良玩家知道寡妇在场。",
    "firstNightReminder": "给寡妇展示魔典，她想看多久就看多久。等她看完后，让她指向一个玩家。那个玩家中毒。唤醒一名善良玩家，告诉他场上有寡妇。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "organ_grinder",
    "name": "街头风琴手",
    "team": "minion",
    "ability": "所有玩家在投票时闭眼，且票数会秘密统计。 每个夜晚，你要选择自己是否醉酒直到下个黄昏。",
    "firstNightReminder": "让街头风琴手选择自己是否醉酒。如果他点头，标记街头风琴手醉酒。",
    "otherNightReminder": "让街头风琴手选择自己是否醉酒。如果他点头，标记街头风琴手醉酒。如果他摇头，移除街头风琴手的醉酒标记。",
    "script": "experimental"
  },
  {
    "id": "psychopath",
    "name": "精神病患者",
    "team": "minion",
    "ability": "每个白天，在提名开始前，你可以公开选择一名玩家：他死亡。 如果你被处决，提名你的玩家需要和你猜拳，只有你输了你才会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "boffin",
    "name": "科学怪人",
    "team": "minion",
    "ability": "恶魔拥有一个不在场的善良角色的能力，即使他醉酒或中毒。你和他都知道他获得了什么能力。",
    "firstNightReminder": "在进行游戏设置时，将角色标记放入盲抽袋前，决定好恶魔获得的角色能力，并为恶魔本身和获得的角色能力做出相应的设置调整。在将角色标记收回并放入魔典后，将恶魔获得的能力对应的角色标记放置在恶魔的角色标记旁。\n\n在首个夜晚，唤醒科学怪人和恶魔。对他们展示“该角色的能力对你生效”信息标记，然后是科学怪人的角色标记，再是恶魔获得能力的那个善良角色标记。在展示后将这个善良角色标记放回到恶魔的角色标记旁。\n按照恶魔具有这个善良角色的能力一样来进行运作，同时恶魔还具有自己本身的能力。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "fearmonger",
    "name": "恐惧之灵",
    "team": "minion",
    "ability": "每个夜晚，你要选择一名玩家：如果你提名他且他被处决，他的阵营落败。当你首次选择或更换目标时，所有玩家都会得知你选择了新的玩家。",
    "firstNightReminder": "唤醒恐惧之灵，让他选择一名玩家，随后通知所有玩家恐惧之灵选择了一名玩家。",
    "otherNightReminder": "唤醒恐惧之灵，让他选择一名玩家，随后如果恐惧之灵的目标发生了变更，通知所有玩家恐惧之灵选择了一名玩家。",
    "script": "experimental"
  },
  {
    "id": "mezepheles",
    "name": "灵言师",
    "team": "minion",
    "ability": "在你的首个夜晚，你会得知一个关键词。首个说出该关键词的善良玩家会在当晚转变为邪恶阵营。",
    "firstNightReminder": "告诉灵言师他的秘密词语。",
    "otherNightReminder": "唤醒第一个说出灵言师词语的玩家并告知他已经变成邪恶阵营。",
    "script": "experimental"
  },
  {
    "id": "marionette",
    "name": "提线木偶",
    "team": "minion",
    "ability": "你以为你是一个善良角色，但其实你不是。恶魔会知道你是提线木偶。[提线木偶会与恶魔邻座]",
    "firstNightReminder": "选择一个邻近恶魔的善良玩家放置提线木偶标记。唤醒恶魔并告知他谁是提线木偶。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "vizier",
    "name": "维齐尔",
    "team": "minion",
    "ability": "所有玩家都知道你是维齐尔。 你在白天时不会死亡。 如果一次提名中有善良玩家投票，你可以让被提名者立即被处决。",
    "firstNightReminder": "告诉所有玩家维齐尔在场，并指向维齐尔玩家。",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "image-6",
    "name": "巫师",
    "team": "minion",
    "ability": "每局游戏限一次，你可以向说书人许愿。如果愿望被实现，可能会伴随着代价和线索。",
    "firstNightReminder": "如果有必要，让巫师的能力生效。",
    "otherNightReminder": "如果有必要，让巫师的能力生效。",
    "script": "experimental"
  },
  {
    "id": "xaan",
    "name": "限",
    "team": "minion",
    "ability": "在等同于初始外来者数量的夜晚，所有镇民玩家中毒直到下个黄昏。[外来者数量任意]",
    "firstNightReminder": "如果夜晚天数等于初始外来者数量，所有镇民玩家中毒到下个黄昏。",
    "otherNightReminder": "如果夜晚天数等于初始外来者数量，所有镇民玩家中毒到下个黄昏。",
    "script": "experimental"
  },
  {
    "id": "harpy",
    "name": "鹰身女妖",
    "team": "minion",
    "ability": "每个夜晚，你要选择两名玩家：明天第一名玩家需要“疯狂”地证明第二名玩家是邪恶的，否则他们之中可能会有人死亡。",
    "firstNightReminder": "唤醒鹰身女妖并让他依次指向两名玩家。标记第一名玩家“疯狂”，标记第二名玩家“第二名”。",
    "otherNightReminder": "唤醒鹰身女妖并让他依次指向两名玩家。标记第一名玩家“疯狂”，标记第二名玩家“第二名”。",
    "script": "experimental"
  },
  {
    "id": "boomdandy",
    "name": "炸弹人",
    "team": "minion",
    "ability": "如果你被处决，除三名玩家以外的其他所有玩家均会死亡。倒数十声后，被最多玩家手指指着的玩家死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  },
  {
    "id": "summoner",
    "name": "召唤师",
    "team": "minion",
    "ability": "在首个夜晚，你会得知三个伪装。在第三个夜晚，你要选择一名玩家：他变成由你选择的邪恶恶魔。[无恶魔在场]",
    "firstNightReminder": "在首个夜晚，对召唤师展示三个不在场的善良角色，作为他的伪装。",
    "otherNightReminder": "在夜晚时，如果召唤师旁放置了“第三晚”提示标记，唤醒召唤师。让他指向一名玩家，和角色列表上的一个恶魔图标。让召唤师重新入睡。唤醒被召唤师选择的玩家。对他展示“你是”信息标记，和恶魔角色标记。再对他展示“你是”信息标记，和朝下的大拇指。用那个恶魔角色标记替换他的角色标记，并让新恶魔重新入睡。",
    "script": "experimental"
  },
  {
    "id": "ojo",
    "name": "奥赫",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一个角色：他死亡。如果该角色不在场，则由说书人来决定谁会被你杀死。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒奥赫，让他选择角色列表上的一个角色。该角色对应的玩家死亡，如果该角色不在场，替奥赫决定今晚谁会因为奥赫能力死亡。",
    "script": "experimental"
  },
  {
    "id": "riot",
    "name": "暴乱",
    "team": "demon",
    "ability": "在第三个白天，所有爪牙会变成暴乱，当天被提名的玩家会立即死亡且必须再次提名一名存活的玩家。",
    "firstNightReminder": "",
    "otherNightReminder": "如果这是游戏中的第三个夜晚，唤醒爪牙告知他们角色变化。",
    "script": "experimental"
  },
  {
    "id": "lord_of_typhon",
    "name": "堤丰之首",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。[邪恶角色全部邻座，你靠近正中，+1爪牙，-或+任意数量外来者]",
    "firstNightReminder": "在进行游戏设置时，将角色标记放入盲抽袋前，移除所有的爪牙角色标记，并加入等量的镇民或外来者角色标记作为补充。\n\n在首个夜晚，分别依次唤醒位于堤丰之首两侧的，等同于常规游戏爪牙数量加一的玩家。分别对这些玩家展示一个不同的爪牙角色标记和朝下的大拇指，再让他们重新入睡。再用展示给他们的爪牙角色标记替换魔典中这些玩家的善良角色标记。然后再如常进行爪牙信息和恶魔信息步骤。",
    "otherNightReminder": "在除首个夜晚以外的每个夜晚，唤醒堤丰之首。让他指向任意一名玩家。那名玩家死亡——用“死亡”提示标记标记那名玩家。让堤丰之首重新入睡。",
    "script": "experimental"
  },
  {
    "id": "al-hadikhia",
    "name": "哈迪寂亚",
    "team": "demon",
    "ability": "每个夜晚*，你可以选择三名玩家（所有玩家都会得知你选了谁）：他们分别秘密决定自己的生死，然后如果他们都存活则都死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "哈迪寂亚选择三名玩家。对所有人宣告第一位玩家，然后唤醒他并让他秘密选择活着还是死去。依次对第二第三位玩家如此做。如果三名玩家都选择活着，他们都死去。",
    "script": "experimental"
  },
  {
    "id": "legion",
    "name": "军团",
    "team": "demon",
    "ability": "每个夜晚*，可能有一名玩家死亡。如果一项提名只有邪恶玩家投票，投票无效。你也会被当作是爪牙。[多数玩家为军团]",
    "firstNightReminder": "",
    "otherNightReminder": "由说书人决定，让哪一名玩家死亡。",
    "script": "experimental"
  },
  {
    "id": "kazali",
    "name": "卡扎力",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。[由你决定谁是什么爪牙，-或+任意数量外来者]",
    "firstNightReminder": "在首个夜晚，唤醒卡扎力。让他指向一名玩家，和角色列表上的一个爪牙角色。用这个爪牙的角色标记替换该玩家原本的角色标记，然后唤醒该玩家，对他展示“你是”信息标记和这个爪牙角色标记，然后展示向下的大拇指。重复这个流程，直到场上有与初始设置时同等数量的爪牙。让卡扎力重新入睡。",
    "otherNightReminder": "除首个夜晚以外的每个夜晚，唤醒卡扎力。让他指向任意一名玩家。那名玩家死亡——在他角色标记旁放置“死亡”提示标记。让卡扎力重新入睡。",
    "script": "experimental"
  },
  {
    "id": "leviathan",
    "name": "利维坦",
    "team": "demon",
    "ability": "如果多于一名善良玩家被处决，邪恶阵营获胜。 所有玩家都知道利维坦在场。 在第五个白天结束时，邪恶阵营获胜。",
    "firstNightReminder": "如果利维坦在场，告知所有人利维坦在场，现在是第一个白天。",
    "otherNightReminder": "如果利维坦在场，告知所有人利维坦在场，现在是第几个白天。（如果玩家一致同意，则无需在已经知晓利维坦在场的前提下在其他夜晚执行此项操作。）",
    "script": "experimental"
  },
  {
    "id": "lleech",
    "name": "痢蛭",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。在你的首个夜晚，你要选择一名存活的玩家：他中毒，只有当他处于死亡状态时你才会立即死亡。",
    "firstNightReminder": "寄生蛭指向一名玩家。放置寄生标记，那名玩家中毒。",
    "otherNightReminder": "寄生蛭指向一名玩家。那名玩家死亡。",
    "script": "experimental"
  },
  {
    "id": "lil_monsta",
    "name": "小怪宝",
    "team": "demon",
    "ability": "每个夜晚，所有爪牙要秘密决定由哪名玩家来照看小怪宝并且“是恶魔”。每个夜晚*，可能会有一名玩家死亡。[+1爪牙]",
    "firstNightReminder": "唤醒所有爪牙，允许他们以指向的方式决定谁照看小怪宝，但不能产生其他交流，否则会有非常糟糕的事情发生。",
    "otherNightReminder": "唤醒所有爪牙，允许他们以指向的方式决定谁照看小怪宝，但不能产生其他交流，否则会有非常糟糕的事情发生。说书人选择一名玩家，那名玩家死亡。",
    "script": "experimental"
  },
  {
    "id": "yaggababble",
    "name": "牙噶巴卜",
    "team": "demon",
    "ability": "在你的首个夜晚，你会得知一段秘密短语。每次你在白天公开说出这段短语，当天便可能会有一名玩家在这之后死亡。",
    "firstNightReminder": "在为首个夜晚做准备时，用纸条或手机便签或其他便捷的设备写下一段短语。\n在首个夜晚，唤醒牙噶巴卜，对他展示这段短语，然后让他重新入睡。\n",
    "otherNightReminder": "每当牙噶巴卜在白天公开说出这段短语时，将一枚“死亡”提示标记放入魔典左侧的中央位置，用以提示你需要在今晚放置这个标记。\n每个夜晚，你需要选择是否将放入魔典中央的“死亡”提示标记放置在一名玩家的角色标记旁。如果你这么做，那么同时为放置了提示标记的角色标记上再放置帷幕标记。这些玩家死亡。",
    "script": "experimental"
  },
  {
    "id": "080",
    "name": "仲裁者",
    "team": "townsfolk",
    "ability": "其他善良玩家不会死于你发起的提名处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "041",
    "name": "倒吊人",
    "team": "townsfolk",
    "ability": "当游戏结束时，如果你曾使用过投票标记投票，对调胜负结果。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "094",
    "name": "公证人",
    "team": "townsfolk",
    "ability": "每个夜晚*，你会得知当天死于处决的玩家与提名他的玩家是否为同一阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒他并告知他是或否。",
    "script": "odyssey"
  },
  {
    "id": "075",
    "name": "圣骑士",
    "team": "townsfolk",
    "ability": "每个夜晚，你会得知两名玩家：他们要么都不是爪牙，要么都不是恶魔。两类线索每夜交替。",
    "firstNightReminder": "告知他两名玩家。",
    "otherNightReminder": "告知他两名玩家。",
    "script": "odyssey"
  },
  {
    "id": "092",
    "name": "天平师",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知一名玩家：他是邪恶玩家，或他与两名邪恶玩家的距离相等。",
    "firstNightReminder": "唤醒他并告知他一名玩家。",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "067",
    "name": "德鲁伊",
    "team": "townsfolk",
    "ability": "如果与你邻近的两名存活玩家的阵营相同，恶魔只能攻击他们。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "081",
    "name": "忍者",
    "team": "townsfolk",
    "ability": "每个白天，如果你是首位或末位发起提名的玩家，且被你提名的玩家是邪恶的，他会在当晚死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "将“暗杀”提示标记替换为“死亡”提示标记。",
    "script": "odyssey"
  },
  {
    "id": "091",
    "name": "捕虫少年",
    "team": "townsfolk",
    "ability": "如果你提名了一名其他玩家，在当晚你会被唤醒并得知他是否为恶魔。",
    "firstNightReminder": "",
    "otherNightReminder": "如果当天捕虫少年提名了其他玩家，唤醒他并告知他是或否。",
    "script": "odyssey"
  },
  {
    "id": "086",
    "name": "故障机器人",
    "team": "townsfolk",
    "ability": "每个夜晚，你会得知当天其他镇民玩家的能力是否均正常生效。",
    "firstNightReminder": "唤醒他并告知他是或否。",
    "otherNightReminder": "唤醒他并告知他是或否。",
    "script": "odyssey"
  },
  {
    "id": "085",
    "name": "敲钟人",
    "team": "townsfolk",
    "ability": "在你首次发起提名时，你可以公开质问一次被提名的玩家他是否为某个角色：如果他说谎，你立即被处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "050",
    "name": "巫女",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择一对邻座的其他玩家：你会得知他们之中是否有爪牙。",
    "firstNightReminder": "让她选择除她自己以外的两名相互邻座的玩家。",
    "otherNightReminder": "让她选择除她自己以外的两名相互邻座的玩家。",
    "script": "odyssey"
  },
  {
    "id": "093",
    "name": "女爵",
    "team": "townsfolk",
    "ability": "每个夜晚，你会得知一个在场的角色。当邪恶玩家死亡时，你醉酒。",
    "firstNightReminder": "唤醒她并告知她一个在场角色。",
    "otherNightReminder": "唤醒她并告知她一个在场角色。",
    "script": "odyssey"
  },
  {
    "id": "090",
    "name": "半人马",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择一名其他玩家（与上个夜晚不同）：如果他的角色类型与你上个夜晚选择的玩家相同，他死亡。",
    "firstNightReminder": "唤醒他并让他选择一名玩家。",
    "otherNightReminder": "唤醒他并让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "013",
    "name": "月光骑士",
    "team": "townsfolk",
    "ability": "每个夜晚*，如果当天无人死于处决，你会被唤醒并要选择一名玩家：如果他是爪牙，他死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果白天没人死于处决，让他选择一名玩家，如果选中爪牙，为该爪牙标记“死亡”。",
    "script": "odyssey"
  },
  {
    "id": "104",
    "name": "武僧",
    "team": "townsfolk",
    "ability": "当恶魔攻击你时，一名存活的邪恶玩家会替代你被攻击。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "109",
    "name": "死眠少女",
    "team": "townsfolk",
    "ability": "当你首次被恶魔攻击时，你不会死亡，并会得知该恶魔的角色。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "003",
    "name": "治安官",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知一名玩家。如果你在夜晚死亡，你会得知一名玩家。他们中一人是爪牙，另一人是外来者。[+1外来者]",
    "firstNightReminder": "告知他一个爪牙或外来者角色。",
    "otherNightReminder": "如果他在当晚死亡，唤醒并告知他一个爪牙或外来者角色（与上次不同）。",
    "script": "odyssey"
  },
  {
    "id": "012",
    "name": "浪人",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一名玩家：如果当晚他被恶魔攻击，一名存活的邪恶玩家会代替他被攻击，且你重获能力。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家，在该玩家旁放置“弹刀”提示标记。",
    "script": "odyssey"
  },
  {
    "id": "005",
    "name": "游歌者",
    "team": "townsfolk",
    "ability": "每个白天，你可以公开选择任意名存活玩家：其中的镇民会醉酒直到你再次选择。当晚你会得知正因你醉酒的人数。",
    "firstNightReminder": "",
    "otherNightReminder": "告诉他有多少名玩家正因他的能力而醉酒。",
    "script": "odyssey"
  },
  {
    "id": "072",
    "name": "海女",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知一名邪恶玩家与你的距离。",
    "firstNightReminder": "钟表匠",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "030",
    "name": "游侠",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一名其他玩家：如果他是爪牙，他死亡；如果他是镇民，你死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果当天有与游侠邻近的存活玩家死亡，让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "025",
    "name": "殉教少女",
    "team": "townsfolk",
    "ability": "如果爪牙死于处决，当晚你会死亡，且所有邪恶角色醉酒直到明天黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "如果“殉教”被放置在场上，让她死亡。",
    "script": "odyssey"
  },
  {
    "id": "043",
    "name": "木乃伊",
    "team": "townsfolk",
    "ability": "如果你死于邪恶玩家发起的提名处决或能力，审判日降临时，你复活。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "048",
    "name": "船长",
    "team": "townsfolk",
    "ability": "每个夜晚*，你会得知恶魔更接近当天被处决玩家的左侧还是右侧。如果邪恶玩家被处决，你醉酒直到下个黎明。",
    "firstNightReminder": "",
    "otherNightReminder": "告知他左或右。",
    "script": "odyssey"
  },
  {
    "id": "101",
    "name": "美人鱼",
    "team": "townsfolk",
    "ability": "每个白天，你可以公开接受一名其他玩家对你的赞美：邪恶角色的能力对他无效，直到你接受了另一名玩家的赞美。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "098",
    "name": "维京人",
    "team": "townsfolk",
    "ability": "当你在死后首次投票时，当前被提名的玩家立即被处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "004",
    "name": "纹章官",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时，你可以选择一名其他玩家：你会得知两名玩家。这三名玩家的角色类型各不相同。[+1外来者]",
    "firstNightReminder": "让他选择一名其他玩家，然后告知他两名玩家。",
    "otherNightReminder": "让他选择一名其他玩家，然后告知他两名玩家。",
    "script": "odyssey"
  },
  {
    "id": "002",
    "name": "猎魔人",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一名玩家：他死亡，且当晚恶魔不能攻击。如果你杀死了恶魔，你和他交换角色和阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒他并让他选择一名玩家，为他选择的玩家标记“死亡”提示标记。",
    "script": "odyssey"
  },
  {
    "id": "087",
    "name": "猎人",
    "team": "townsfolk",
    "ability": "如果被你提名的玩家在当晚死亡，你会被唤醒且要选择一名玩家：他死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "如果当天猎人提名的玩家死亡，唤醒猎人并让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "028",
    "name": "牛仔",
    "team": "townsfolk",
    "ability": "在首个夜晚，一名爪牙会得知牛仔在场。每当他发起提名，你会在当晚被唤醒。你们中首次被对方提名的玩家立即被处决。",
    "firstNightReminder": "唤醒一名爪牙，告知他牛仔在场。",
    "otherNightReminder": "如果得知牛仔在场的爪牙发起了提名，唤醒牛仔。",
    "script": "odyssey"
  },
  {
    "id": "014",
    "name": "湖中仙女",
    "team": "townsfolk",
    "ability": "每个夜晚，说书人会向你展示两种能力，你可以选择其中一种：它替代你的原能力。",
    "firstNightReminder": "唤醒他并向他展示两种能力。",
    "otherNightReminder": "如果当天有玩家被处决，唤醒她。",
    "script": "odyssey"
  },
  {
    "id": "049",
    "name": "灵媒",
    "team": "townsfolk",
    "ability": "如果镇民死于你发起的提名处决，当晚他会得知灵媒在场。",
    "firstNightReminder": "",
    "otherNightReminder": "如果“得知”提示标记被放置，唤醒放置有“得知”提示标记的玩家并告知他灵媒在场。",
    "script": "odyssey"
  },
  {
    "id": "029",
    "name": "猫猫探险队",
    "team": "townsfolk",
    "ability": "每个白天，一名未曾探险过的玩家可以公开申请探险。在当晚，如果他存活，你会得知一名与他阵营对立的玩家。",
    "firstNightReminder": "",
    "otherNightReminder": "如果当天的探险者存活，唤他并告知一名与探险者阵营对立的玩家。",
    "script": "odyssey"
  },
  {
    "id": "042",
    "name": "王牌",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择一名其他玩家：你会得知他是什么花色。四种花色秘密对应着四种角色类型。",
    "firstNightReminder": "唤醒他并让他选择一名其他玩家，告知他该玩家对应的花色。",
    "otherNightReminder": "唤醒他并让他选择一名其他玩家，告知他该玩家对应的花色。",
    "script": "odyssey"
  },
  {
    "id": "001",
    "name": "画家",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知一个在场角色。每个夜晚*，你要选择一名玩家：如果他是你最近得知的角色，你会得知另一个在场角色。",
    "firstNightReminder": "告知他一个在场角色，并在该玩家角色标记旁放置“最近得知”标记。",
    "otherNightReminder": "让他选择一名玩家，如果他选中被标记“最近得知”的玩家，告知他一个新的在场角色。\n提示标记",
    "script": "odyssey"
  },
  {
    "id": "105",
    "name": "皮匠",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知一个距离你最近的爪牙角色。",
    "firstNightReminder": "告知他一个邪恶角色。",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "011",
    "name": "真心人",
    "team": "townsfolk",
    "ability": "在你的首个白天，你可以邀请说书人见证你与一名玩家互通角色，随后你会私下得知是否有人说谎。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "006",
    "name": "空中飞人",
    "team": "townsfolk",
    "ability": "你死亡的当晚会知所有角色类型的玩家各一名。你死于善良玩家发起的提名处决或能力时，你醉酒。",
    "firstNightReminder": "",
    "otherNightReminder": "如果他死亡，唤醒他并告知他爪牙、恶魔、镇民、外来者玩家各一名。",
    "script": "odyssey"
  },
  {
    "id": "100",
    "name": "艺伎",
    "team": "townsfolk",
    "ability": "在你存活与死亡的首个夜晚，你会分别得知一名存活玩家：他们的阵营对立。",
    "firstNightReminder": "唤醒她并告知她一名玩家。",
    "otherNightReminder": "如果她当天死亡，唤醒她并告知她一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "069",
    "name": "见闻家",
    "team": "townsfolk",
    "ability": "每个白天，你可以从说书人处得知一条正确信息（关于某种角色类型）。如果该类型的玩家数量异常，你改为得知错误信息。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "023",
    "name": "调香师",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时，你可以选择一名玩家或一个邪恶角色：他会得知调香师在场。",
    "firstNightReminder": "让她选择一名玩家或一个角色。",
    "otherNightReminder": "让她选择一名玩家或一个角色。",
    "script": "odyssey"
  },
  {
    "id": "051",
    "name": "超感者",
    "team": "townsfolk",
    "ability": "每个夜晚，恶魔要选择一名除你以外的存活玩家：恶魔和你会得知他是什么角色。",
    "firstNightReminder": "唤醒恶魔让他选择一名玩家，告知恶魔该玩家是什么角色。让恶魔入睡，再唤醒超感者告知该玩家是什么角色。",
    "otherNightReminder": "唤醒恶魔让他选择一名玩家，告知恶魔该玩家是什么角色。让恶魔入睡，再唤醒超感者告知该玩家是什么角色。",
    "script": "odyssey"
  },
  {
    "id": "079",
    "name": "邪术师",
    "team": "townsfolk",
    "ability": "如果恶魔杀死了你，此后的每个夜晚，你要选择一名玩家：他死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "102",
    "name": "通灵师",
    "team": "townsfolk",
    "ability": "每个夜晚*，你要选择一名玩家：如果他已死亡，你会得知他的阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒他并告知他善良或邪恶。",
    "script": "odyssey"
  },
  {
    "id": "021",
    "name": "送报童",
    "team": "townsfolk",
    "ability": "每个白天，你可以从说书人处获取一条新闻，如果你公开宣读了该新闻，当晚你会得知它是否为事实。",
    "firstNightReminder": "",
    "otherNightReminder": "如果他在白天宣读了新闻，唤醒他并告知他是否为事实。",
    "script": "odyssey"
  },
  {
    "id": "082",
    "name": "近卫",
    "team": "townsfolk",
    "ability": "审判日降临前的每个夜晚*，你要选择：你当晚不会死亡；或与你邻近的两名存活玩家当晚不会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "让他指向自己或身边的玩家。",
    "script": "odyssey"
  },
  {
    "id": "070",
    "name": "谜语人",
    "team": "townsfolk",
    "ability": "每个白天，你可以从说书人处得知一条谜语。谜语的谜底指向一个在场角色。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "022",
    "name": "调音师",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知一个外来者角色和一个爪牙角色。其中有且只有一个角色在场。",
    "firstNightReminder": "告知他一个爪牙角色及一个外来者角色。",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "076",
    "name": "酒娘",
    "team": "townsfolk",
    "ability": "1、爪牙被处决时，不会死亡但会永久醉酒。 2、爪牙不会死于处决。爪牙被处决时醉酒，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "060",
    "name": "阴阳师",
    "team": "townsfolk",
    "ability": "每个夜晚，你会得知一名玩家：他与你上个夜晚得知的玩家阵营不同。",
    "firstNightReminder": "唤醒他并告知他任意一名玩家。",
    "otherNightReminder": "唤醒他并告知他任意一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "077",
    "name": "乌贼娘",
    "team": "outsider",
    "ability": "当你首次即将死亡时，你可能不会死亡，但所有镇民会醉酒直到明天黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "099",
    "name": "化妆师",
    "team": "outsider",
    "ability": "如果你提名的或提名你的玩家是爪牙或恶魔，当晚他可以选择变成不在场的同类型角色，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒被放置“换妆”提示标记的玩家。",
    "script": "odyssey"
  },
  {
    "id": "053",
    "name": "双面人",
    "team": "outsider",
    "ability": "审判日降临前的每个夜晚*，你会转变为与上个死于处决的玩家对立的阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "如果当天死于处决的玩家阵营与他不同，唤醒他并告知他的新阵营。",
    "script": "odyssey"
  },
  {
    "id": "032",
    "name": "地狱弃子",
    "team": "outsider",
    "ability": "每个白天提名开始前，爪牙可以公开拥立地狱弃子：你立即转变为邪恶并与恶魔交换角色，然后他醉酒。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "033",
    "name": "堂吉诃德",
    "team": "outsider",
    "ability": "一名玩家会被镇民玩家的能力当做恶魔角色（风车），即使你已死亡。你可以从说书人处得知风车是谁，然后风车会改为另一名玩家。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "007",
    "name": "大小姐",
    "team": "outsider",
    "ability": "当你首次即将死亡时，可能会有两名存活玩家代替你死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "045",
    "name": "养蜂人",
    "team": "outsider",
    "ability": "一名玩家中毒，即使你已死亡。每个夜晚，你要选择一名玩家：如果他因你中毒，他恢复健康。",
    "firstNightReminder": "让他选择一名玩家。",
    "otherNightReminder": "唤醒他并让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "096",
    "name": "捣蛋鬼",
    "team": "outsider",
    "ability": "在你的首个夜晚与首个白天，镇民玩家的能力一定会产生错误信息。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "097",
    "name": "殉情者",
    "team": "outsider",
    "ability": "在你的首个夜晚，你要选择一名其他玩家：你或他死亡之后，另一人随时可能死亡。",
    "firstNightReminder": "让他选择一名玩家。",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "107",
    "name": "河童",
    "team": "outsider",
    "ability": "在审判日，你可以从说书人处得知外来者玩家的数量。[任意数量外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "066",
    "name": "泰坦",
    "team": "outsider",
    "ability": "在首个夜晚，你转变为邪恶，并获得所有不在场爪牙的能力。[泰坦在配置时被当作爪牙]",
    "firstNightReminder": "唤醒泰坦并告知他转变为邪恶阵营，并向他展示所有不在场的爪牙角色标记。",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "055",
    "name": "海猫王",
    "team": "outsider",
    "ability": "死亡玩家可以上交投票标记成为寻宝人。审判日降临时，如果你已经死亡，所有寻宝人平分12枚投票标记。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "027",
    "name": "狼孩",
    "team": "outsider",
    "ability": "当其他狼孩均死亡时，你变成邪恶的不在场爪牙。[可能有多个外来者是狼孩]",
    "firstNightReminder": "",
    "otherNightReminder": "如果狼孩在白天转变角色，唤醒他并告知他的角色及阵营变化。",
    "script": "odyssey"
  },
  {
    "id": "044",
    "name": "猫猫合唱团",
    "team": "outsider",
    "ability": "一名玩家醉酒。在黄昏时，说书人可能会指定一首歌曲：如果玩家们成功合唱，所有镇民不受中毒醉酒影响，直到下个黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "015",
    "name": "白骑士",
    "team": "outsider",
    "ability": "每局游戏限一次，疯狂地想要存活的玩家在被处决时可能不会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "052",
    "name": "盗血者",
    "team": "outsider",
    "ability": "审判日降临前，唯一存活的邪恶玩家死亡时，你变成他的角色与阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "059",
    "name": "石像鬼",
    "team": "outsider",
    "ability": "当你首次被其他玩家提名时，他死亡。如果你杀死了邪恶玩家，你变成他的角色与阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "095",
    "name": "稻草人",
    "team": "outsider",
    "ability": "你以为你是一个镇民角色，但其实你不是。如果你死亡，下次处决不会造成死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "068",
    "name": "蘑菇仔",
    "team": "outsider",
    "ability": "你与爪牙会在死于处决后保留能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "026",
    "name": "雪怪",
    "team": "outsider",
    "ability": "每局游戏限一次，恶魔可以公开猜测你是雪怪，如果猜中，当天他被处决时你会代替他被处决。如果白天没人被处决，你的阵营落败。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "054",
    "name": "黑帮律师",
    "team": "outsider",
    "ability": "每个夜晚，你会得知一名玩家：下个白天，如果你和他中有人被处决，另一人可能会替代其被处决。",
    "firstNightReminder": "唤醒黑帮律师， 然后指向标记了“当事人”的一名玩家。",
    "otherNightReminder": "唤醒黑帮律师， 然后指向标记了“当事人”的一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "035",
    "name": "代号X",
    "team": "minion",
    "ability": "每局游戏限一次，在你的第X个夜晚，你可以选择任意玩家共X次：他们中毒直到下个黄昏。被多次选择的玩家改为死亡。",
    "firstNightReminder": "当晚是他入场的第几个夜晚，就让他选择几次（玩家）。",
    "otherNightReminder": "当晚是他入场的第几个夜晚，就让他选择几次（玩家）。",
    "script": "odyssey"
  },
  {
    "id": "056",
    "name": "克隆",
    "team": "minion",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一名玩家：他死亡，且你变成他的角色。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "037",
    "name": "双头巨人",
    "team": "minion",
    "ability": "如果你死亡，其他双头巨人会在当晚死亡。只有所有双头巨人一起投票，他们的投票才有效。[+1双头巨人（你决定谁是）]",
    "firstNightReminder": "让他选择一名玩家。如果选中爪牙或恶魔，让他重新选择。",
    "otherNightReminder": "如果当天有双头巨人死亡，让其他双头巨人也死亡。",
    "script": "odyssey"
  },
  {
    "id": "103",
    "name": "夜叉",
    "team": "minion",
    "ability": "每个夜晚*，你可以选择一名当天被你提名或提名了你的玩家：他死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名被放置了“结怨”提示标记的玩家。",
    "script": "odyssey"
  },
  {
    "id": "057",
    "name": "巫医",
    "team": "minion",
    "ability": "每个夜晚，你要选择一名玩家：他中毒且死亡延迟，直到你改变选择。",
    "firstNightReminder": "让他选择一名玩家。",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "112",
    "name": "双生花",
    "team": "minion",
    "ability": "你以为你是一个镇民角色，但其实你不是。[+1双生花，两名双生花邻座]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "034",
    "name": "帕克",
    "team": "minion",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一个非恶魔角色：他死亡。如果该角色不在场，你要再选择一名玩家：他变成该角色。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一个角色。如果这个角色不在场，让他再选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "064",
    "name": "幻",
    "team": "minion",
    "ability": "如果与你邻座的玩家都是存活的，镇民玩家的能力一定会产生错误信息。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "008",
    "name": "斯芬克斯",
    "team": "minion",
    "ability": "每个夜晚，你要选择一个角色：下个白天，如果该角色在场，他会被公开询问一个是非问题。没有答对的玩家可能会被处决。",
    "firstNightReminder": "唤醒并让他选择一个角色。",
    "otherNightReminder": "唤醒并让他选择一个角色。",
    "script": "odyssey"
  },
  {
    "id": "061",
    "name": "毒尾",
    "team": "minion",
    "ability": "你顺时针方向上最近的1+X名镇民中毒。[无外来者在场，X为因你减去的外来者数量]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "046",
    "name": "百臂巨人",
    "team": "minion",
    "ability": "如果你在死于处决后，立即公开声明你是百臂巨人，你下一次投票的票数会记作你今天获得的票数。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "036",
    "name": "独眼巨人",
    "team": "minion",
    "ability": "每个夜晚，你要选择一名玩家：你和恶魔会得知他是什么角色。如果你选中了外来者，他会得知独眼巨人在场。[+1外来者]",
    "firstNightReminder": "让他选择一名玩家。",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "084",
    "name": "狐妖",
    "team": "minion",
    "ability": "每个夜晚*，你要选择一名玩家和一个外来者角色：如果该角色不在场，他变成该角色。如果他是该角色，他死亡。[-1或+1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一个角色及一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "111",
    "name": "毒爆",
    "team": "minion",
    "ability": "当有玩家被处决时，与他邻近的两名镇民中毒直到明天黄昏。如果白天没人被处决，所有镇民中毒直到明天黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "024",
    "name": "玩偶",
    "team": "minion",
    "ability": "你以为你是一个善良角色，但其实你不是。如果你被恶魔杀死，恶魔要选择一名玩家：他变成玩偶。[玩偶会与恶魔邻座]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "083",
    "name": "晓",
    "team": "minion",
    "ability": "善良阵营在你存活时无法获胜。死于处决的恶魔会在黎明时重获能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "071",
    "name": "萨满",
    "team": "minion",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择四个不同类型的角色：对每个不在场的角色，一名同类型的玩家会变成该角色。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一个角色。",
    "script": "odyssey"
  },
  {
    "id": "113",
    "name": "达摩",
    "team": "minion",
    "ability": "如果其他玩家回答了你的问题，他可能会死亡。如果你回答了其他玩家的问题，你可能会死亡。你不会死于其他原因。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "074",
    "name": "逆蝶",
    "team": "minion",
    "ability": "在第X个夜晚，你要选择是否令与你距离为X的玩家中毒直到下个黄昏。",
    "firstNightReminder": "唤醒逆蝶，他要点头或摇头。",
    "otherNightReminder": "唤醒逆蝶，他要点头或摇头。",
    "script": "odyssey"
  },
  {
    "id": "062",
    "name": "雪女",
    "team": "minion",
    "ability": "在你存活与死亡的首个夜晚，你要分别选择一名玩家：他中毒。",
    "firstNightReminder": "让他选择一名玩家。",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "073",
    "name": "骚客",
    "team": "minion",
    "ability": "每个夜晚，你会得知一个字（均出自同一句诗词）。首次有存活玩家吟诵这句诗词时，他立即被处决，即使你已死亡。",
    "firstNightReminder": "唤醒他并向他出示一个字。",
    "otherNightReminder": "唤醒他并向他出示一个字。",
    "script": "odyssey"
  },
  {
    "id": "017",
    "name": "麻醉师",
    "team": "minion",
    "ability": "每个夜晚，你要选择一名玩家：他中毒直到你改变选择。因你中毒的存活玩家恢复健康时，会得知麻醉师在场。",
    "firstNightReminder": "让他选择一名玩家。",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "009",
    "name": "麻风侏儒",
    "team": "minion",
    "ability": "镇民玩家使用自身能力选择你时，会立即变成麻风侏儒，且你失去所有能力。你的胜负条件与邪恶玩家相同，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "odyssey"
  },
  {
    "id": "016",
    "name": "黑骑士",
    "team": "minion",
    "ability": "每个夜晚*，你会得知当天死亡的外来者玩家并要猜测他的角色：如果猜中，会有一名玩家死亡。[+1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒他并指向当天死亡的外来者玩家，让他猜测外来者角色。",
    "script": "odyssey"
  },
  {
    "id": "019",
    "name": "亚瑟",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。当亚瑟首次攻击爪牙时，亚瑟会与其交换角色，且两名存活玩家代替其被攻击。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "089",
    "name": "克拉肯",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。如果你在审判日降临前死亡，改为你假死。你假死时只能杀死与你邻近的存活玩家。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "010",
    "name": "刻耳柏洛斯",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家，每当你选中邪恶玩家，你要再选一名玩家：他们死亡。被你杀死的爪牙会保留能力。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒他并让他选择一名玩家，如果他选中了邪恶玩家，让他继续选择。",
    "script": "odyssey"
  },
  {
    "id": "063",
    "name": "劣魔",
    "team": "demon",
    "ability": "每个夜晚*，会有一名玩家死亡。你可以在被提名后呼唤同伴：如果存活玩家中邪恶玩家更少，一名爪牙会变成劣魔。",
    "firstNightReminder": "",
    "otherNightReminder": "由说书人决定，让哪一名玩家死亡。",
    "script": "odyssey"
  },
  {
    "id": "088",
    "name": "回响",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一个角色：他死亡。如果该角色不在场，下个夜晚你要额外选择一个角色（可叠加）。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一个角色。",
    "script": "odyssey"
  },
  {
    "id": "018",
    "name": "塞壬",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡，且你要选择是否永久失去你的下一条能力。镇民玩家的能力一定会产生错误信息。",
    "firstNightReminder": "",
    "otherNightReminder": "让她选择一名玩家，然后她要选择是否谢幕。",
    "script": "odyssey"
  },
  {
    "id": "038",
    "name": "大巫妖",
    "team": "demon",
    "ability": "每个夜晚*，你可以选择一名死亡玩家（未曾被大巫妖选择过），他要选择两名玩家：他们死亡。否则，会有一名玩家死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "040",
    "name": "奇美拉",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一个除奇美拉以外的恶魔角色（与前两次的选择均不同）：你获得该角色的能力直到下个黄昏。[-1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一个除奇美拉以外的恶魔角色。",
    "script": "odyssey"
  },
  {
    "id": "065",
    "name": "奸奇",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。当你得知恶魔信息时，会有更多的伪装，你要选择其中一个：你获得该角色的能力。",
    "firstNightReminder": "让他从三个伪装角色中挑选一个。",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "110",
    "name": "恐虐",
    "team": "demon",
    "ability": "每个夜晚*，你要选择两名玩家：他们死亡。如果有善良玩家在白天死亡，当晚你选择的其中一名玩家不会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择两名玩家。",
    "script": "odyssey"
  },
  {
    "id": "020",
    "name": "恶堕",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他必死。死亡外来者的胜负条件与你相同，即使你已死亡。[1名或2名外来者在场]",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "058",
    "name": "海之子",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。说书人决定自己拥有哪些爪牙的能力，并会尽可能地帮助你获胜。[无爪牙在场，任意数量外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "039",
    "name": "海德拉",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。如果你在审判日降临前死于处决，一名善良玩家与一名邪恶玩家会变成海德拉。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "106",
    "name": "米诺陶",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名存活玩家：他死亡。审判日降临前，如果所有邪恶玩家均死于处决，你的阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名存活玩家。",
    "script": "odyssey"
  },
  {
    "id": "108",
    "name": "纳垢",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一对邻座的玩家：其中一人中毒直到你再次选择，另一人死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "114",
    "name": "色孽",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡，且你可以让他得知你是色孽。最近一名得知你是色孽的玩家胜负条件与你相同，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "047",
    "name": "骷髅王",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。当你以通常条件获胜时，曾上交投票标记的镇民也会获胜。[+1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "078",
    "name": "龙卷",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。每个黄昏*，你会与你顺时针方向上最近的存活邪恶玩家交换角色。",
    "firstNightReminder": "",
    "otherNightReminder": "让他选择一名玩家。",
    "script": "odyssey"
  },
  {
    "id": "031",
    "name": "女武神",
    "team": "townsfolk",
    "ability": "每个夜晚*，死亡延迟到你同意死亡名单之后才会发生。如果你不同意，当晚有且只有你死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "告知她所有当晚即将死亡的玩家有哪些，并让她选择是否同意。",
    "script": "odyssey"
  },
  {
    "id": "hermit",
    "name": "隐士",
    "team": "outsider",
    "ability": "你拥有所有外来者能力。[-0~1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "experimental"
  }
]);
 profiles.push(...[
  {
    "id": "yuxinshi_juanbing",
    "name": "羽信使",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知与你距离最远的邪恶角色。",
    "firstNightReminder": "唤醒羽信使，对他展示一个邪恶角色标记。",
    "otherNightReminder": "",
    "script": "stars"
  },
  {
    "id": "waijiaoguan_yanyumengxi",
    "name": "外交官",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一名玩家：与他阵营不同的玩家不会死亡，直到下个黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒外交官，他可以摇头不使用能力，或选择一名玩家。",
    "script": "stars"
  },
  {
    "id": "linghangyuan_heixing",
    "name": "领航员",
    "team": "townsfolk",
    "ability": "每个夜晚*，以钟为罗盘，上个处决指针为南，你得知某个方位有邪恶。如果该玩家为邪恶，指针视为北。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒领航员，上北下南左西右东，用手势向他展示一个方位。",
    "script": "stars"
  },
  {
    "id": "beidaozhe_coambar",
    "name": "悲悼者",
    "team": "townsfolk",
    "ability": "如果与你邻近的存活玩家死亡，你会在当晚得知另一名与你邻近的存活玩家的角色。",
    "firstNightReminder": "",
    "otherNightReminder": "如果当天有与悲悼者的存活玩家死亡，对他展示一枚角色标记。",
    "script": "stars"
  },
  {
    "id": "shuizhanshi_zhiyanzhongbiaojiang",
    "name": "水占师",
    "team": "townsfolk",
    "ability": "一名镇民醉酒。每个夜晚，如果他的能力未正常生效（从上个黎明到你被唤醒时）,你得知一名邪恶玩家，否则得知一名善良玩家。",
    "firstNightReminder": "唤醒水占师，对他指向一名玩家。",
    "otherNightReminder": "唤醒水占师，对他指向一名玩家。",
    "script": "stars"
  },
  {
    "id": "shouyaoren_tixianzhengke",
    "name": "守钥人",
    "team": "townsfolk",
    "ability": "一名恶魔醉酒。每个夜晚*，首个被恶魔选择的玩家死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "stars"
  },
  {
    "id": "hezhongmao_kaka",
    "name": "盒中猫",
    "team": "townsfolk",
    "ability": "你即将死亡时转变为一个相同角色类型的不在场角色，并在死亡后保留能力。[说书人决定你的角色类型（非恶魔）]",
    "firstNightReminder": "",
    "otherNightReminder": "如果盒中猫在白天转变角色，唤醒他并告知他的角色。",
    "script": "stars"
  },
  {
    "id": "luxiangxuejia_zhangshunfeng",
    "name": "颅相学家",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择一个角色类型（与前两晚不同）和一名除你以外的玩家：你会被善良玩家当作相应类型的角色和阵营，然后你会得知你们角色类型是否相同。",
    "firstNightReminder": "唤醒颅相学家，让他选择一种角色类型和一名除他以外的玩家，以点头或摇头告知他角色类型是否相同。",
    "otherNightReminder": "唤醒颅相学家，让他选择一种与前两晚不同的角色类型和一名除他以外的玩家，以点头或摇头告知他角色类型是否相同。",
    "script": "stars"
  },
  {
    "id": "anubisi_xiaolong",
    "name": "阿努比斯",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择两名玩家：他们中在角色列表靠上的玩家死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒阿努比斯，他可以摇头不使用能力，或者用手指向两名玩家。",
    "script": "stars"
  },
  {
    "id": "zhanzhengjisi_xiaoxic2h43g",
    "name": "战争祭司",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一名除你以外未选择过的存活玩家，然后重复此流程，直到最后两次选择的玩家类型相同。[+1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒战争祭司，他可以摇头不使用能力，或选择一名存活的玩家，然后重复此流程，直到最后两次选择的玩家类型相同。",
    "script": "stars"
  },
  {
    "id": "kaoguxuejia_tiexuecuicuisha",
    "name": "考古学家",
    "team": "townsfolk",
    "ability": "在房间里找到说书人留下的线索，即可获得奖励。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "stars"
  },
  {
    "id": "mimaxuejia_axi",
    "name": "密码学家",
    "team": "townsfolk",
    "ability": "爪牙和恶魔互相不认识。首个夜晚，他们会得知同一个关键词，你会得知与之相关的线索。",
    "firstNightReminder": "如果密码学家在场，将今晚的爪牙信息和恶魔信息环节变换为告知线索环节。且密码学家会得知这个线索",
    "otherNightReminder": "",
    "script": "stars"
  },
  {
    "id": "diantiguanliyuan_zz",
    "name": "电梯管理员",
    "team": "townsfolk",
    "ability": "每个白天，你可以邀请一名未邀请过的其他存活玩家秘密选择剧本的一行，当晚你得知该行有多少名角色在场。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒电梯管理员，对他用手势比划数字来告知他有多少名角色在场。",
    "script": "stars"
  },
  {
    "id": "geduo_tixianzhengke",
    "name": "鸽多",
    "team": "outsider",
    "ability": "你拥有一种在游戏结束时加入获胜阵营的方法（即使你已死亡），但你不知道是什么。每个白天，你可以拜访说书人获得关于这个方法的线索。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "stars"
  },
  {
    "id": "shengkongdeng_shanxueyuzhu",
    "name": "声控灯",
    "team": "outsider",
    "ability": "你安静时可能死亡，说话时可能复活，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "stars"
  },
  {
    "id": "chuanyuezhe_jichen",
    "name": "穿越者",
    "team": "outsider",
    "ability": "你拥有一个剧本外的角色能力。每局游戏限一次，存活爪牙可以公开猜测你是穿越者，如果猜对，你的阵营落败。[+0~1外来者]",
    "firstNightReminder": "唤醒穿越者并告知他的能力是什么。根据穿越者的具体能力决定是否需要唤醒穿越者、何时唤醒、唤醒后让他做出什么操作或得知什么信息。",
    "otherNightReminder": "根据穿越者的具体能力决定是否需要唤醒穿越者、何时唤醒、唤醒后让他做出什么操作或得知什么信息。",
    "script": "stars"
  },
  {
    "id": "dipinglunzhe_heixing",
    "name": "地平论者",
    "team": "outsider",
    "ability": "[圆桌在两名相邻玩家之间裂开，恶魔得知并可以重新选择这个裂隙在哪]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "stars"
  },
  {
    "id": "beiguanzhuyizhe_zyz",
    "name": "悲观主义者",
    "team": "outsider",
    "ability": "当你得知你死亡时，你要公开声称一个恶魔角色：如果该角色不在场，恶魔获得他的能力一天一夜。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "stars"
  },
  {
    "id": "emu_chiyu",
    "name": "蛾母",
    "team": "minion",
    "ability": "上个死亡的邪恶玩家保留能力并变成不在场的同类型角色，你“是该角色”，但最后一天不能发动。",
    "firstNightReminder": "",
    "otherNightReminder": "如果有邪恶玩家死在白天，唤醒那名邪恶玩家，他保留能力且转变为不在场的同类型角色。",
    "script": "stars"
  },
  {
    "id": "lajiao_kaka",
    "name": "“辣椒”",
    "team": "minion",
    "ability": "在你的首个夜晚，你要查看魔典，并选择剧本列表的一列：该列所有非爪牙角色中毒且必定产生错误信息。",
    "firstNightReminder": "唤醒辣椒，让她查看魔典。在她查看完毕后让她选择列表中的一列，那些玩家中毒。",
    "otherNightReminder": "",
    "script": "stars"
  },
  {
    "id": "shandongzhe_dongyu",
    "name": "煽动者",
    "team": "minion",
    "ability": "你存活/死亡时，镇民产生的信息对错翻转。[+0/+1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "stars"
  },
  {
    "id": "guanzhongtaier_Naglfar",
    "name": "罐中胎儿",
    "team": "minion",
    "ability": "每个黄昏，被处决的玩家可以公开为你挑选两个其它爪牙能力：你拥有他们直到下个黄昏；没有人为你挑选时：你秘密挑选。",
    "firstNightReminder": "",
    "otherNightReminder": "如果没有人为罐中胎儿选择技能，罐中胎儿秘密选择自己的技能。",
    "script": "stars"
  },
  {
    "id": "dingxuwangzi_jichen",
    "name": "定序王子",
    "team": "minion",
    "ability": "在你的首个夜晚，你决定x的数值。每个夜晚，第x个因自身能力被唤醒的玩家当晚中毒。",
    "firstNightReminder": "唤醒定序王子，他要示意一个数字，对应行动顺序的玩家中毒。",
    "otherNightReminder": "对应行动顺序的玩家中毒。",
    "script": "stars"
  },
  {
    "id": "shenzhangzhifu_baibianxjun",
    "name": "神杖之父",
    "team": "minion",
    "ability": "你和每个恶魔角色都有一个相克规则：这给他们带来独特的增强。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "stars"
  },
  {
    "id": "zhongli_tixianzhengke",
    "name": "重力",
    "team": "demon",
    "ability": "每个夜晚*，你要选择两名玩家：他们死亡。如果你不在场，恶魔可以阻止当晚全部死亡，变为重力。[一名爪牙失去能力]",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒重力，让他攻击两名玩家。如果重力不在场，那么恶魔可以对说书人指向重力，当晚不会有玩家死亡。",
    "script": "stars"
  },
  {
    "id": "jielv_xiaoxic2h43g",
    "name": "戒律",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家，他死亡。当某种角色类型（旅行者除外）首次没有存活玩家时，所有镇民中毒直到明天黄昏［+1/-1外来者］",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒戒律，让他攻击一名玩家。如果在白天已经发生某种类型没有存活玩家，中毒效果会立即生效而不是恶魔行动顺序。",
    "script": "stars"
  },
  {
    "id": "shengcai_shenqierxuesonger",
    "name": "圣裁",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。镇民产生的信息不会与他上一次产生信息的正误相同。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒圣裁，让他攻击一名玩家。",
    "script": "stars"
  },
  {
    "id": "shenyuan_jichen",
    "name": "深渊",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。每有一个与你相邻的玩家死亡，你获得一个不在场的爪牙能力。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒深渊，让他攻击一名玩家。如果他相邻的玩家死亡，那名玩家死亡时告知深渊他获得了什么爪牙能力。",
    "script": "stars"
  },
  {
    "id": "meiying_suziye",
    "name": "魅影",
    "team": "demon",
    "ability": "死于处决的邪恶玩家保留能力。每个夜晚*，你要选择一名玩家：他死亡。在一名死亡玩家被处决后，他的阵营落败，在此之前邪恶阵营不会落败。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒魅影，让他攻击一名玩家。",
    "script": "stars"
  },
  {
    "id": "yong_meiyouzanzhu",
    "name": "蛹",
    "team": "minion",
    "ability": "每个夜晚*，你要选择一个角色，如果该角色不在场，你变成该角色。如果你的角色类型因此改变，相同角色类型的一名玩家死亡。[爪牙都是蛹]",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒蛹，让他选择一个角色；如果该角色不在场，他变成该角色；若角色类型改变，选择一名同类型玩家死亡。",
    "script": "stars"
  },
  {
    "id": "maomaojuntuan_meiyouzanzhu",
    "name": "猫猫军团",
    "team": "townsfolk",
    "ability": "你顺时针上最近的猫猫军团是你的同伴。 每个夜晚，你会得知同伴邻近的两名存活的玩家中是否有邪恶玩家。[+0~2猫猫军团]",
    "firstNightReminder": "唤醒猫猫军团，如果其同伴邻近的两名存活玩家都是善良的，摇头告知否；否则点头告知是。",
    "otherNightReminder": "唤醒猫猫军团，如果其同伴邻近的两名存活玩家都是善良的，摇头告知否；否则点头告知是。",
    "script": "stars"
  },
  {
    "id": "fengyi_meiyouzanzhu",
    "name": "凤翼",
    "team": "townsfolk",
    "ability": "每个夜晚，你会从恶魔的顺时针方向得知下一名玩家的阵营。",
    "firstNightReminder": "唤醒凤翼，告知他从恶魔顺时针方向起第1名玩家的阵营。",
    "otherNightReminder": "告知凤翼从恶魔顺时针方向起第N名玩家的阵营（每夜推进一名）。",
    "script": "stars"
  },
  {
    "id": "f1431400-3621-4729-84b4-baaece0ac86e",
    "name": "芭蕾舞者",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知在你的顺时针方向的镇民与你的距离是奇数居多还是偶数居多。如果两者相同，你得知的信息由说书人决定。",
    "firstNightReminder": "唤醒芭蕾舞者，你得知奇数还是偶数。",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "blacksmith",
    "name": "铁匠",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知有几名外来者在场。所有外来者醉酒。[+1外来者]",
    "firstNightReminder": "。",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "_pirate",
    "name": "海盗",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知几名海盗在场。如果所有存活善良角色均为海盗，善良阵营获胜。[+0或+1海盗]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194993459",
    "name": "学者",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你得知哪些邪恶角色在场。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194994783",
    "name": "天才",
    "team": "townsfolk",
    "ability": "每个夜晚，你可以选择一个善良角色：你获得他的能力，直到你下次选择。你每隔一晚醉酒一天。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194997552",
    "name": "猎犬饲养员",
    "team": "townsfolk",
    "ability": "每个夜晚，你得知当晚被邪恶玩家能力选择的存活玩家与你的最近距离。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194998180",
    "name": "放贷人",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择除你以外的一名存活玩家：你转变为他的阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195006132",
    "name": "诗人",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择除你及旅行者以外的一名玩家：你会得知他的角色的英文名字中的一个字母。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194996378",
    "name": "少妇",
    "team": "townsfolk",
    "ability": "每个夜晚，你得知一名玩家。他醉酒直到下个黄昏，他因自身能力获得的信息均为错误。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194997234",
    "name": "马厩男孩",
    "team": "townsfolk",
    "ability": "每个夜晚，你会得知一个在场的角色。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194997367",
    "name": "猎巫人",
    "team": "townsfolk",
    "ability": "每个夜晚，你可以选择一名玩家：你会得知他的阵营。如果他明天白天没有被处决，当晚他转变为邪恶阵营。你不会转变为邪恶阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "hunter",
    "name": "追猎者",
    "team": "townsfolk",
    "ability": "每个夜晚*，你可以选择一名玩家：如果与他邻近的玩家中有且只有一名是邪恶的，且他不是恶魔，他死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "唤醒追猎者，让其选择一名玩家，或摇头表示不选择。如果他选择的玩家的邻座玩家中正好只有一名邪恶玩家，标记那名玩家死亡。",
    "script": "overseas"
  },
  {
    "id": "yuque_194991406",
    "name": "投机者",
    "team": "townsfolk",
    "ability": "每个夜晚*，你得知今天提名你的角色。如果你“疯狂”地证明你是投机者，你得知错误信息。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194995528",
    "name": "失眠者",
    "team": "townsfolk",
    "ability": "每个夜晚*，你得知当晚死去的一个角色。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194998337",
    "name": "大亨",
    "team": "townsfolk",
    "ability": "一名与你握手的玩家可能会醉酒直到明天黄昏。每个夜晚*，你会得知你是否在今天白天与邪恶玩家握手。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194997610",
    "name": "窥私者",
    "team": "townsfolk",
    "ability": "每个夜晚*，选择除你以外的一名玩家：如果他今晚死亡，所有玩家会知道你是窥私者。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194993849",
    "name": "占星师",
    "team": "townsfolk",
    "ability": "【中文翻译】每个白天，你要拜访说书人得知一条错误信息。每局游戏限一次，你得知正确信息。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194998403",
    "name": "车夫",
    "team": "townsfolk",
    "ability": "每个白天，你可以拜访说书人并选择一个话题，说书人会告诉你一个与他有关的事实。如果你的邻近存活玩家阵营不同，你得知错误信息。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194998841",
    "name": "悲剧演员",
    "team": "townsfolk",
    "ability": "每个白天，一名邪恶玩家要对某件事疯狂，否则他可能死亡。每个白天，你要对某件事疯狂，否则你可能死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194992662",
    "name": "药剂师",
    "team": "townsfolk",
    "ability": "每局游戏限一次，如果说书人同意，你可以公开改变一条游戏规则。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "safeguard",
    "name": "保镖",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时，你可以选择一个除自己以外的角色：邪恶玩家的负面能力对他无效。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194998370",
    "name": "风笛手",
    "team": "townsfolk",
    "ability": "每局游戏限一次，你可以公开选择发动能力：爪牙可以秘密选择转变为善良阵营，但下一个被处决的玩家的阵营落败。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194999096",
    "name": "机修工",
    "team": "townsfolk",
    "ability": "在你的首个白天，你可以拜访说书人获得一个剧本外角色的能力，即使你醉酒或中毒。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194994054",
    "name": "享乐主义者",
    "team": "townsfolk",
    "ability": "与你邻近的存活玩家的醉酒（不含旅行者）。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194996433",
    "name": "商人",
    "team": "townsfolk",
    "ability": "你可以与任意一名其他玩家缔结约定。在新约定达成之前，如果有玩家违约，你和他之一会在当晚死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194993985",
    "name": "邮差",
    "team": "townsfolk",
    "ability": "在最后一晚，即使你已死亡，选择一名玩家：他得知某些信息。你可以随时决定他得知什么。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194996844",
    "name": "内奸",
    "team": "townsfolk",
    "ability": "你也是爪牙，且被当作邪恶阵营。每局游戏限一次，恶魔可以公开猜测你是内奸，如果猜对，你的阵营落败，即使你已失去能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194993756",
    "name": "修女",
    "team": "townsfolk",
    "ability": "除首个夜晚，其他善良玩家不会醉酒、中毒或得知错误信息。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194998069",
    "name": "凤凰",
    "team": "townsfolk",
    "ability": "如果你在夜晚死亡，最后一个白天，你以一个不在场镇民的角色复活。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194996483",
    "name": "女王",
    "team": "townsfolk",
    "ability": "如果你的邻近的两名玩家是善良的，他们得知你是女王。疯狂证明女王在场的玩家可能会被处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194990970",
    "name": "大力士",
    "team": "townsfolk",
    "ability": "如果你在白天是最“疯狂”证明自己是大力士的人，今晚选择了你的玩家之一会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194996775",
    "name": "女家教",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你得知一个距离你最近的非镇民玩家的角色类型（旅行者除外）。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194994342",
    "name": "流氓",
    "team": "townsfolk",
    "ability": "你存活时可以选择打破规则。如果说书人发现了，会有坏事发生，即使你已失去能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199017439",
    "name": "幻形妖",
    "team": "townsfolk",
    "ability": "每局游戏限一次，在夜晚时*，你可以选择一名玩家：他死亡，你会与被你杀死的非爪牙玩家交换角色和阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_200002972",
    "name": "讲师",
    "team": "townsfolk",
    "ability": "每个白天，你可以拜访说书人并得知一名玩家做错的事。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199017430",
    "name": "面包师",
    "team": "townsfolk",
    "ability": "每个夜晚*，你会得知你提名过和提名过你的玩家共有几种角色类型。累计达到三种时，他们中会有一名玩家醉酒。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194998913",
    "name": "保姆",
    "team": "townsfolk",
    "ability": "每个夜晚*，除你以外在夜晚遮住眼睛的玩家不会死亡。但如果你死亡，他们可能死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "_prospector",
    "name": "勘探者",
    "team": "townsfolk",
    "ability": "每个夜晚*，你会得知与你今天提名的玩家最近的邪恶玩家位于他的顺时针还是逆时针方向。如果距离相等，你得知的信息由说书人决定。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194996557",
    "name": "女教师",
    "team": "townsfolk",
    "ability": "即将转变为邪恶但仍保持原角色的玩家，会得知女教师在场，他可以选择保持善良阵营。[至少1名能转变邪恶阵营的角色在场]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194994873",
    "name": "清道夫",
    "team": "townsfolk",
    "ability": "如果与你邻座的玩家均已死亡，会有好事发生。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194996332",
    "name": "审计员",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知有多少名在场角色拥有设置调整的能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194994826",
    "name": "手相师",
    "team": "townsfolk",
    "ability": "恶魔在攻击生效之前一晚发动攻击，即使你已死亡。每个夜晚，你得知谁受到攻击。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194993350",
    "name": "驯狮人",
    "team": "townsfolk",
    "ability": "如果与你邻近的存活善良玩家死于处决，当晚恶魔的负面能力对除你以外的玩家无效。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194998318",
    "name": "德鲁伊",
    "team": "townsfolk",
    "ability": "每个白天，你可以公开选择一名玩家。如果你们中有人当晚被恶魔杀死，一名存活的爪牙会代替你们死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194998735",
    "name": "病患",
    "team": "townsfolk",
    "ability": "每局游戏限一次，你会被唤醒：你每有一个夜晚未被唤醒，就会获得一个在场角色的能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199017906",
    "name": "不信教者",
    "team": "townsfolk",
    "ability": "如果恶魔杀死了你，他会转变为善良阵营，但他不知道。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194994636",
    "name": "外交官",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你得知哪些玩家是爪牙。如果一个被你得知的爪牙被处决，你的阵营落败，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194997781",
    "name": "媒人",
    "team": "townsfolk",
    "ability": "每个白天，你可以向说书人私下选择两名玩家：你得知他们是否与一项正常发动的能力相关。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194998023",
    "name": "绞刑吏",
    "team": "townsfolk",
    "ability": "每局游戏限一次，选择一名玩家。以顺时针方向开始，3秒内没有公开宣称自身角色的善良玩家死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194994495",
    "name": "王子",
    "team": "townsfolk",
    "ability": "除首个夜晚以外，只要你没有被提名，你就不会死亡、转变为邪恶阵营或改变角色。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194994258",
    "name": "先知",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你要选择一个天数：如果那一天所有死亡玩家均为善良，你死亡随后他们以旅行者的形式重新入场。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199017444",
    "name": "麻风病人",
    "team": "townsfolk",
    "ability": "如果恶魔杀死了你，他中毒。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199017433",
    "name": "摩门教徒",
    "team": "townsfolk",
    "ability": "每个白天限一次，如果你的一名与你邻近的玩家公开同意，他会变成摩门教徒。如果他不同意，你们失去能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194993210",
    "name": "养蜂人",
    "team": "townsfolk",
    "ability": "一名邪恶玩家会被当作善良阵营、镇民或外来者。每局游戏限一次，如果你公开猜测到这名玩家是谁，你的阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194992504",
    "name": "庸医",
    "team": "townsfolk",
    "ability": "每个夜晚，你要选择两名存活玩家：今晚任何玩家使用自身能力选择他们之一作为目标时，改为选中另一名玩家。恶魔不会因此能力而死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199017447",
    "name": "箍桶匠",
    "team": "townsfolk",
    "ability": "如果你被提名，除旅行者以外的所有其他玩家醉酒直到黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_208120049",
    "name": "巡林客",
    "team": "townsfolk",
    "ability": "在你的首个夜晚，你会得知与爪牙邻近的善良角色数量。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "goldsmith_button",
    "name": "金匠",
    "team": "townsfolk",
    "ability": "【英文原文】 【中文翻译】 每局游戏限一次，在夜晚时，你可以得知今天有哪些除你以外的角色被邪恶玩家的能力选择或影响了。（从上个黎明到你被唤醒时）",
    "firstNightReminder": "金匠可以选择使用能力。如果他这么做了，向金匠战术所有今天内被邪恶玩家选择或影响的角色，且金匠失去能力，之后的夜晚无需再唤醒金匠。",
    "otherNightReminder": "金匠可以选择使用能力。如果他这么做了，向金匠战术所有今天内被邪恶玩家选择或影响的角色，且金匠失去能力，之后的夜晚无需再唤醒金匠。",
    "script": "overseas"
  },
  {
    "id": "yuque_199958012",
    "name": "小说家",
    "team": "townsfolk",
    "ability": "【中文能力】每个白天，你可以邀请一名玩家（与之前不同）与你分别私下询问说书人：他可以问一个是非问题，随后你会得知一个答案相同的是非问题。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_203549228",
    "name": "香料商",
    "team": "townsfolk",
    "ability": "【英文原文】 【中文翻译】 每个夜晚*，你得知今天白天有多少邪恶玩家投票，如果整个白天都没有邪恶玩家投票，你醉酒，【游戏性修改】",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195001052",
    "name": "隐修者",
    "team": "outsider",
    "ability": "你拥有其他所有外来者的能力。其他对外来者的设置调整不会生效。[无其他外来者在场]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "prisoner",
    "name": "囚犯",
    "team": "outsider",
    "ability": "在你的首个夜晚，你会得知一个不在场角色。如果超过半数玩家同意释放你，你会变成这个角色和对应的阵营。在你被释放前你不能投票。",
    "firstNightReminder": "唤醒囚犯并向他出示一个不在场的角色标记。",
    "otherNightReminder": "如果在白天时多数玩家表决同意将你释放，在夜晚唤醒囚犯提示角色的转变。如有必要，提示其阵营得转变。",
    "script": "overseas"
  },
  {
    "id": "yuque_195001367",
    "name": "骗子",
    "team": "outsider",
    "ability": "你会在夜晚转变为首个死于处决的玩家的阵营。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195001402",
    "name": "牧驴人",
    "team": "outsider",
    "ability": "如果你被提名的当天你或恶魔未被处决，你的阵营落败。[你的角色标记是方形的]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195001598",
    "name": "流浪汉",
    "team": "outsider",
    "ability": "如果在对你的提名中有人投票，你可能会立即被处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199020281",
    "name": "寻踪者",
    "team": "outsider",
    "ability": "一名爪牙额外拥有一个不在场的爪牙能力（他会得知此事），即使你已死亡。如果你提名了他，当晚你会得知他的全部能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195001646",
    "name": "花花公子",
    "team": "outsider",
    "ability": "每个夜晚，你要选择一名除你以外的存活玩家：如果明天你和他中有人被处决，另一人也会被处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195002116",
    "name": "佃农",
    "team": "outsider",
    "ability": "如果你落败，你下一局游戏还是佃农，即使你已死亡。[如果不在盲抽袋中：-1镇民]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_203549175",
    "name": "暴徒",
    "team": "outsider",
    "ability": "每次提名中，在你之后与你投票不同的一名玩家可能死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199020284",
    "name": "作秀狂",
    "team": "outsider",
    "ability": "在说书人宣布你死亡时没有鼓掌的玩家可能会一起死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_203953845",
    "name": "贵妇",
    "team": "outsider",
    "ability": "如果你死亡，当晚恶魔可以查看魔典。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195001797",
    "name": "孤儿",
    "team": "outsider",
    "ability": "如果你是善良的且死亡，恶魔只会因你参与投票的处决而死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_203952058",
    "name": "幸运儿",
    "team": "outsider",
    "ability": "第一个提名你的玩家当晚转变为邪恶阵营。如果你第一个提名自己，你的阵营落败。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199020277",
    "name": "走卒",
    "team": "outsider",
    "ability": "每个白天，你只能投票一次。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195002046",
    "name": "公主",
    "team": "outsider",
    "ability": "【中文翻译】如果一名玩家死亡后声称自己是公主（你必须声称），另一名玩家可以选择代替死亡。如果代替死亡的玩家是邪恶的，你的阵营落败。【游戏性修改】如果一名善良玩家在得知自己死亡后声称自己是公主（你必须声称），存活玩家可以选择代替他死亡。如果代替死亡的玩家是邪恶的，你的阵营落败。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199019895",
    "name": "猫夫人",
    "team": "outsider",
    "ability": "正在维护",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199019927",
    "name": "劫犯",
    "team": "outsider",
    "ability": "会有一至两名善良玩家的投票标记会被秘密地记为零，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199020270",
    "name": "宝钻精灵",
    "team": "outsider",
    "ability": "正在维护",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199811084",
    "name": "乌鸦嘴",
    "team": "outsider",
    "ability": "【中文能力】可能会有一名善良玩家得知一条虚假的信息，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_203549178",
    "name": "绝密档案",
    "team": "outsider",
    "ability": "【英文原文】【中文翻译】当你死于处决时，与你邻近的存活玩家不计入邪恶阵营获胜条件。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "bullfighter",
    "name": "斗牛士",
    "team": "minion",
    "ability": "在你发起提名后，一名除你以外的投票玩家会在当晚死亡，如果没有除你以外的玩家投票，你可能在当晚死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195000819",
    "name": "马戏领班",
    "team": "minion",
    "ability": "每局游戏限一次，即使你已死亡，你可以选择成为说书人。此后你仍然可以投票。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "charoit",
    "name": "战车",
    "team": "minion",
    "ability": "与你顺时针距离为1的玩家中毒。如果是邪恶的非旅行者玩家，改为和他交换角色。每个夜晚*，或该玩家已死亡，该距离+1。",
    "firstNightReminder": "初始设置时，在战车顺时针距离为1的善良玩家的角色标记旁放置“控制”提示标记以表示他是由于战车的能力中毒；如果战车的顺时针距离为1的玩家是邪恶的，则战车将与其交换角色，随后在新战车的顺时针距离为1的善良玩家的角色标记旁放置“控制”提示标记。",
    "otherNightReminder": "将战车的“控制”提示标记以顺时针方向推进到下一名玩家。如果落在邪恶玩家上，则战车将与其交换角色，随后在新战车的顺时针距离为1的善良玩家的角色标记旁放置“控制”提示标记。",
    "script": "overseas"
  },
  {
    "id": "yuque_199810980",
    "name": "癫人",
    "team": "minion",
    "ability": "每个夜晚，你要选择至多三名玩家：他们以为自己受到疯狂能力的影响，但实际上没有。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195000292",
    "name": "魔仆",
    "team": "minion",
    "ability": "【英文原文】Each night*, you wake with the Demon and choose a player: they die. If you die, the demon loses its ability.【中文翻译】每个夜晚*，你和恶魔一起被唤醒并选择一名玩家：他死亡。如果你死亡，恶魔会失去能力。【游戏性修改】",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199964816",
    "name": "谜题魔",
    "team": "minion",
    "ability": "当小于等于五名存活玩家（旅行者不计算在内），邪恶阵营落败时，所有玩家要同时猜测谁是谜题魔，如果少于两名善良玩家猜测你，邪恶阵营获胜，即使你已死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199810919",
    "name": "冒名客",
    "team": "minion",
    "ability": "每个白天，在你首次“疯狂”地证明自己是一个在场角色时，你在那天让他中毒并获得该角色的能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194990941",
    "name": "致幻师",
    "team": "minion",
    "ability": "与你邻近的玩家（旅行者除外）会被善良玩家的能力当作错误的阵营和角色。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_200003954",
    "name": "西西里人",
    "team": "minion",
    "ability": "提名阶段开始时，如果你的阵营中只有你公开选择了一名存活的非旅行者玩家，而他今天白天没有被处决，他的阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199031253",
    "name": "夜影",
    "team": "minion",
    "ability": "每个夜晚，你要选择两名玩家：其中的非恶魔玩家会被当作与他原本阵营相反的阵营，直到下个黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199031325",
    "name": "憎恶",
    "team": "minion",
    "ability": "每个夜晚*，你可以选择一名玩家：他死亡，在此之前，与他阵营相同的另一名玩家复活。恶魔死亡不会导致游戏结束。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194999938",
    "name": "桶栖者",
    "team": "minion",
    "ability": "在你的首个夜晚，你要选择一个外来者：所有外来者都会是你选择的外来者。[-或+任意数量外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_208110868",
    "name": "吸血鬼",
    "team": "minion",
    "ability": "你知道一些善良玩家和他们的角色。[这些玩家失去能力并以为自己是爪牙]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195000973",
    "name": "稻草人",
    "team": "minion",
    "ability": "你会被善良玩家当作恶魔，恶魔会被善良玩家当作爪牙。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199031365",
    "name": "铜蛇帮",
    "team": "minion",
    "ability": "如果你提名了一名玩家，他和与他邻座的玩家中的善良玩家中毒，直到你下次提名。[-1或+1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195001014",
    "name": "参议员",
    "team": "minion",
    "ability": "玩家只能提名各自邻近的存活玩家。每个夜晚，你要选择自己是否醉酒直到下个黄昏。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199031343",
    "name": "恶棍",
    "team": "minion",
    "ability": "【中文】如果白天没有存活善良玩家被其他玩家提名，邪恶获胜。每个夜晚*，如果你被提名，恶魔当晚可能会被当作善良的镇民或外来者角色。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_194999737",
    "name": "赝品",
    "team": "minion",
    "ability": "你拥有一个在场爪牙的能力。如果没有其他爪牙在场，在你的首个夜晚，你选择一名爪牙：你获得他的能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199031376",
    "name": "浊瘴",
    "team": "minion",
    "ability": "如果邪恶玩家提名了存活的邪恶玩家，他们交换角色。如果善良玩家公开声称驱散浊瘴，你和镇民玩家中毒。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195000144",
    "name": "诺克斯之女",
    "team": "minion",
    "ability": "善良玩家的信息翻转对错。每个玩家第一次说出“诺克斯之女”时：如果他是善良玩家，你失去能力；如果他是邪恶玩家，你重新获得能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195000061",
    "name": "蛇发女妖",
    "team": "minion",
    "ability": "每个夜晚，选择一名玩家：如果下一个白天他离开座位，他死亡。如果场上少于或等于三名玩家，你失去能力。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_208113222",
    "name": "亡灵骑士",
    "team": "minion",
    "ability": "每个夜晚*，你会得知当天死亡的外来者是谁，且你要猜测他的角色，如果你猜对，会有一名玩家死亡。[+1外来者]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199031046",
    "name": "浪劫",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡，随后你可以选择一名玩家：如果他上个白天被邪恶玩家提名过，他死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195002601",
    "name": "夏柯怀特",
    "team": "demon",
    "ability": "每个夜晚，你要选择任意数量玩家：他们会一起被唤醒得知此事。如果明天白天他们中有玩家被处决，所有被选择的玩家立即死亡。如果没有存活玩家被处决，邪恶阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195003887",
    "name": "多罗迈特",
    "team": "demon",
    "ability": "每个夜晚，你要选择一名玩家：他转变为邪恶阵营。每局游戏限一次，你在进行选择时失效。第五个白天结束后，邪恶阵营获胜。[无爪牙在场]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "sissaphyth",
    "name": "西西弗斯",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。在夜晚时，如果所有爪牙死亡，你要选择一个除你以外的恶魔角色：你变成那个恶魔，并且每晚行动两次。",
    "firstNightReminder": "",
    "otherNightReminder": "如果没有存活的爪牙，让西西斐斯指向角色列表上的一个其他恶魔角色标记，然后通知他角色变化，并将“行动两次”提示标记放在角色标记旁边。否则，唤醒西西斐斯。让他指向任意一名玩家。那名玩家死亡——在他角色标记旁放置“死亡”提示标记。让西西斐斯重新入睡。",
    "script": "overseas"
  },
  {
    "id": "yuque_200004043",
    "name": "范扎兹",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡且你转变为他的阵营。如果你死亡，你的阵营落败。如果只有两名玩家存活，你的阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "lecadeau",
    "name": "献礼",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。首个提名你的镇民会在当晚变成邪恶的献礼，而你会随之死亡。但每局游戏只能成功转化一次。",
    "firstNightReminder": "",
    "otherNightReminder": "如果有镇民在白天提名了献礼，唤醒那名镇民并告诉他你现在是邪恶的献礼，但当天晚上不要让其选择目标攻击，而是标记原献礼死亡。",
    "script": "overseas"
  },
  {
    "id": "yuque_200003347",
    "name": "惠斯普",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。如果有镇民玩家提名了你，你死亡。如果在同一天里有两名善良玩家发起提名，邪恶阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195002553",
    "name": "佐迪翁",
    "team": "demon",
    "ability": "在你的首个夜晚，你能查看魔典。每个夜晚*，存活玩家之中位于剧本列表最顶部一行的会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199810744",
    "name": "齐'纳克",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。一名善良玩家会知道你在两名玩家之中。如果有爪牙存活时你被处决，你的阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195003132",
    "name": "提普-提普",
    "team": "demon",
    "ability": "每个夜晚*，会有一名玩家死亡。在最后一晚，你要选择一名玩家：他必须疯狂地证明你不是恶魔，否则他的阵营落败。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199965616",
    "name": "泽德拉丝",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。你的夜晚行动顺序位于夜晚最末尾。[+1爪牙]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199031072",
    "name": "伽迪斯",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡，然后你会得知一名在昨天白天提及过你的玩家：你可以让他死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199031091",
    "name": "九头蛇",
    "team": "demon",
    "ability": "每个夜晚*，即使你已死亡，你要选择一名玩家：他死亡。死亡的爪牙可以选择变为九头蛇，但每局游戏仅能成功转化一次。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195002575",
    "name": "活体病毒",
    "team": "demon",
    "ability": "在你的首个夜晚，三名除你以外的玩家被感染。每个夜晚*，你要选择一名玩家：他被感染。如果被感染的玩家发起提名，他死亡并感染被提名者。在你的第四个白天结束时，邪恶阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195002921",
    "name": "神言",
    "team": "demon",
    "ability": "每个夜晚*，每有一名存活善良玩家在黄昏后举手，就会有一名玩家死亡。如果没有任何存活的善良玩家举手，邪恶阵营获胜。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199031065",
    "name": "魂归者",
    "team": "demon",
    "ability": "【英文原文】【中文翻译】游戏开始时所有玩家死亡。死亡玩家可以提名，被处决的死亡玩家复活。每个夜晚*，选择一名玩家：他复活。如果所有邪恶玩家存活，邪恶阵营获胜。【游戏性修改】提名投票的规则反转，被处决的死亡玩家复活。每个夜晚*，你要选择一名玩家：他复活。如果所有善良玩家被复活过，邪恶阵营获胜。你不会失去能力。[所有玩家死亡]",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195003041",
    "name": "蠕行恐惧",
    "team": "demon",
    "ability": "【英文原文】Each night*, mark up to 3 players or kill all marked players. Marked players learn that they are marked.【中文翻译】每个夜晚*，你要选择至多三名玩家进行标记，或者选择让所有被标记的玩家死亡。被标记的玩家会得知他们被标记了。【游戏性修改】",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195003482",
    "name": "谎言女王",
    "team": "demon",
    "ability": "【英文原文】Each night* choose 3 players to dupe: each chooses a different alive player, 2 of which die. All players learn who you duped.【中文翻译】每个夜晚*，选择欺骗三名玩家：每名被欺骗的玩家要选择一个不同的存活玩家，被选择的玩家里两名死亡。所有玩家都知道谁被你欺骗了。【游戏性修改】每个夜晚*，你可以选择三名玩家进行欺骗（所有玩家都会得知你选了谁）：他们需要分别选择一名玩家，被选择的玩家中的两名会死亡。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_203953955",
    "name": "巴洛-弗",
    "team": "demon",
    "ability": "【英文原文】Each night*, choose a player: they die. Players killed by the Barrow-Fog register as alive during the day.【中文翻译】每个夜晚*，你要选择一名玩家：他死亡。在白天时，被巴洛-弗杀死的玩家会被当作存活。【游戏性修改】",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195003422",
    "name": "莉莉丝",
    "team": "demon",
    "ability": "每个夜晚*，你要选择一名玩家：他死亡。如果被你杀死的玩家与你的某个特征均不同，他们转变为邪恶并不再能在这局游戏中投票。所有人都知道这个特征是什么。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_195003160",
    "name": "灵魂之槌",
    "team": "demon",
    "ability": "【英文原文】Each night*, choose a player: they die. After the final night, the dead may not talk to the living.【中文翻译】每个夜晚*，选择一名玩家：他死亡。最后一夜结束后，死亡玩家不能与存活玩家交流。【游戏性修改】每个夜晚*，你要选择一名玩家：他死亡。如果游戏可能在下个夜晚结束，死亡玩家不能与存活玩家交流。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  },
  {
    "id": "yuque_199031099",
    "name": "寂灭",
    "team": "demon",
    "ability": "【英文原文】【中文翻译】每个夜晚*，你要选择一名玩家：他死亡。投票改为累计计算。每当白天有一名玩家的累计票数达到存活玩家数，该玩家被处决。【游戏性修改】每个夜晚*，你要选择一名玩家：他死亡。投票改为累计计算。每个白天结束时，累计票数最高的玩家被处决。",
    "firstNightReminder": "",
    "otherNightReminder": "",
    "script": "overseas"
  }
]);
 profiles.push({id:'princess',name:'公主',team:'townsfolk',ability:'在你的首个白天，如果你提名并处决了一名玩家，当晚恶魔不会造成死亡。',firstNightReminder:'',otherNightReminder:'如果公主在今天白天提名并处决了一名玩家，当晚恶魔不会造成死亡。',script:'official-other'});
 const pair=(label,team)=>({label,targets:2,targetLabel:'能力信息中的两名玩家',roleTeams:[team],roleLabel:'得知的角色',sentence:'得知了{targets}中有一名{role}。'});
 const roleOnly=(label,teams,sentence)=>({label,targets:0,roleTeams:teams,roleLabel:'得知的角色',sentence});
 const one=(label,sentence,excludeSelf=false)=>({label,targets:1,targetLabel:'能力选择的玩家',excludeSelf,sentence});
 const direct=(label,sentence)=>({label,targets:0,sentence});
 const shot=label=>({...one(label,'选择{targets}开枪，目标{choice}。'),choiceLabel:'行动结果',choices:['死亡','未死亡']});
 const number=(label,max,sentence)=>({label,targets:0,numberLabel:'得知的数字',min:0,max,sentence});
 const any=['townsfolk','outsider','minion','demon','traveller'];
 const forms={
  washerwoman:[pair('得知了','townsfolk'),roleOnly('得知了（仅记录角色）',['townsfolk'],'得知了镇民角色{role}。')],
  librarian:[pair('得知了','outsider'),roleOnly('得知了（仅记录角色）',['outsider'],'得知了外来者角色{role}。'),direct('得知没有外来者','得知没有外来者在场。')],
  investigator:[pair('得知了','minion'),roleOnly('得知了（仅记录角色）',['minion'],'得知了爪牙角色{role}。'),direct('得知没有爪牙','得知没有爪牙在场。')],
  chef:[number('得知邪恶邻座对数',30,'得知场上有 {number} 对邻座的邪恶玩家。')],
  empath:[number('得知邻近邪恶玩家数',2,'得知邻近的两名存活玩家中有 {number} 名邪恶玩家。')],
  fortune_teller:[{...pair('选择两名玩家占卜','demon'),roleTeams:undefined,choices:['有恶魔','没有恶魔'],choiceLabel:'得知的结果',sentence:'选择{targets}占卜，得知其中{choice}。'}],
  undertaker:[{...one('得知被处决玩家的角色','得知今天死于处决的{targets}是{role}。'),roleTeams:any,roleLabel:'得知的角色'},roleOnly('得知了（仅记录角色）',any,'得知今天死于处决的玩家是{role}。')],
  monk:[one('选择保护玩家','选择保护{targets}，当晚恶魔的负面能力对其无效。',true)],
  ravenkeeper:[{...one('死亡后查验玩家','夜晚死亡后选择{targets}，得知其角色为{role}。'),roleTeams:any,roleLabel:'得知的角色'}],
  virgin:[{...one('首次被提名','被{targets}首次提名，提名者{choice}。'),targetLabel:'提名自己的玩家',choiceLabel:'提名者的结果',choices:['被处决','未被处决']}],
  slayer:[shot('开枪')],
  soldier:[direct('免受恶魔能力影响','不受恶魔的负面能力影响。')],
  mayor:[one('转移夜间死亡','夜晚即将死亡时，改由{targets}代替死亡。',true),direct('触发三人胜利','三人存活且白天无人被处决，所属阵营获胜。')],
  butler:[one('选择主人','选择{targets}作为主人。',true)],
  drunk:[roleOnly('以为自己是某个镇民',['townsfolk'],'以为自己是{role}。')],
  recluse:[direct('被当作邪恶阵营','被当作邪恶阵营。'),roleOnly('被当作某个爪牙或恶魔',['minion','demon'],'被当作{role}。')],
  saint:[direct('被处决导致阵营落败','死于处决，所属阵营落败。')],
  poisoner:[one('选择中毒玩家','选择{targets}中毒，持续至次日白天。')],
  spy:[direct('查看魔典','查看了魔典。'),direct('被当作善良阵营','被当作善良阵营。'),roleOnly('被当作某个镇民或外来者',['townsfolk','outsider'],'被当作{role}。')],
  scarlet_woman:[roleOnly('接替死亡的恶魔',['demon'],'因恶魔死亡，变成了{role}。')],
  baron:[direct('增加外来者','初始设置增加两名外来者。')],
  imp:[one('选择夜间击杀玩家','选择{targets}作为夜间击杀目标。'),{...one('自刀并传位','自刀并传位给{targets}。'),targetLabel:'接替小恶魔的玩家'}],
  beggar:[{...one('接受死亡玩家的投票标记','接受{targets}的投票标记，得知其为{choice}。'),targetLabel:'提供投票标记的玩家',choices:['善良阵营','邪恶阵营'],choiceLabel:'得知的阵营'},direct('免疫中毒与醉酒','不受中毒和醉酒影响。')],
  scapegoat:[one('代替其他玩家被处决','代替{targets}被处决。')],
  gunslinger:[shot('向刚投票的玩家开枪')],
  thief:[one('选择负票玩家','选择{targets}，其次日投票算作负数。',true)],
  bureaucrat:[one('选择三票玩家','选择{targets}，其次日投票算作三票。',true)]
 };

 // Forms follow the local ability text and both night reminders. Separate
 // outcomes are records, never instructions to mutate the live grimoire.
 const good=['townsfolk','outsider'],evil=['minion','demon'];
 const many=(label,n,sentence,extra={})=>({label,targets:n,sentence,...extra});
 const outcome=(label,sentence,choices,extra={})=>({...direct(label,sentence),choices,choiceLabel:'记录的结果',...extra});
 const info=(label,sentence,extra={})=>({...direct(label,sentence),resultRequired:true,resultLabel:'信息内容（必填）',...extra});
 const goodRole=(label,sentence)=>roleOnly(label,good,sentence);
 Object.assign(forms,{
  // 梦殒春宵
  clockmaker:[{...number('得知恶魔与爪牙的最近距离',30,'得知恶魔与爪牙之间最近的距离为 {number}。'),min:1}],
  dreamer:[{...one('选择玩家并得知两个角色','选择{targets}，得知其为{role1}或{role2}。',true),excludeTravellers:true,targetLabel:'除自己及旅行者以外的玩家',roleSlots:[{label:'得知的善良角色',teams:good},{label:'得知的邪恶角色',teams:evil}]}],
  snake_charmer:[outcome('选择玩家','选择存活的{targets}，{choice}。',['未交换角色与阵营','交换角色与阵营，原恶魔中毒'],{targets:1,targetLabel:'存活玩家（可选择自己）'})],
  mathematician:[number('得知能力未正常生效的人数',30,'得知从上个黎明至被唤醒时，有 {number} 名玩家的能力因其他角色而未正常生效。')],
  flowergirl:[outcome('得知恶魔是否投票','得知今天白天{choice}。',['有恶魔投票','没有恶魔投票'])],
  town_crier:[outcome('得知爪牙是否提名','得知今天白天{choice}。',['有爪牙发起提名','没有爪牙发起提名'])],
  oracle:[number('得知死亡邪恶玩家数',30,'得知死亡的玩家中有 {number} 名邪恶玩家。')],
  savant:[info('得知一真一假两条信息','私下询问说书人，得知两条信息（一真一假）。',{resultLabel:'两条信息（请分别填写，必填）'})],
  seamstress:[outcome('比较两名玩家的阵营','选择{targets}，得知他们{choice}。',['属于同一阵营','属于不同阵营'],{targets:2,excludeSelf:true,targetLabel:'除自己以外的两名玩家'}),direct('暂不使用能力','当晚暂不使用能力。')],
  philosopher:[goodRole('获得善良角色的能力','选择获得{role}的能力；若该角色在场，对应玩家醉酒。'),direct('暂不使用能力','当晚暂不使用能力。')],
  artist:[info('询问一个是非问题','向说书人询问一个是非问题，得到回答：{choice}。',{choices:['是','否','无法确定'],choiceLabel:'说书人的回答',resultLabel:'提出的问题（必填）'})],
  juggler:[{...one('公开猜测玩家的角色','公开猜测{targets}是{role}。'),roleTeams:any,roleLabel:'猜测的角色',hint:'首个白天最多猜测五次；每次猜测分别添加记录，同一玩家可被重复猜测。'},number('得知猜对的次数',5,'得知首个白天的角色猜测中有 {number} 次正确。')],
  sage:[many('被恶魔杀死后得知两名玩家',2,'被恶魔杀死后，得知{targets}中有一名是杀死自己的恶魔。')],
  mutant:[outcome('疯狂证明外来者身份','疯狂证明自己是外来者，{choice}。',['被处决','未被处决'])],
  sweetheart:[one('死亡后使玩家醉酒','死亡后，{targets}开始醉酒。')],
  barber:[many('死亡后恶魔交换两名玩家的角色',2,'死亡后，恶魔选择交换{targets}的角色。',{targetLabel:'由恶魔选择的两名玩家（不能选择其他恶魔）'}),direct('死亡后恶魔不交换角色','死亡后，恶魔未选择交换角色。')],
  klutz:[outcome('死亡后公开选择玩家','得知自己死亡后公开选择存活的{targets}，{choice}。',['未因此触发阵营落败','因目标邪恶而所属阵营落败'],{targets:1,targetLabel:'存活玩家'})],
  evil_twin:[{...one('得知对立双子的玩家与角色','得知对立双子为{targets}，其角色是{role}。',true),roleTeams:any,roleLabel:'对立双子的角色'},direct('善良双子被处决','善良双子被处决，邪恶阵营获胜。'),direct('双子均存活阻止善良获胜','两名双子均存活，善良阵营无法获胜。')],
  witch:[one('选择诅咒玩家','选择{targets}受到诅咒；若其次日白天发起提名，则死亡。'),one('诅咒玩家提名后死亡','受到诅咒的{targets}发起提名并死亡。'),direct('三人存活失去能力','只有三名玩家存活，失去诅咒能力。')],
  cerenovus:[{...one('选择玩家和疯狂证明的角色','选择{targets}疯狂证明自己是{role}。'),roleTeams:good,roleLabel:'需要疯狂证明的善良角色'},one('目标因未疯狂而被处决','{targets}因未疯狂证明指定角色而被处决。')],
  'pit-hag':[{...one('选择玩家和要变成的角色','选择让{targets}变成{role}，{choice}。'),roleTeams:any,roleLabel:'要变成的角色',choices:['该角色不在场，目标变成该角色','该角色已在场，未发生变化','创造恶魔，当晚死亡由说书人决定'],choiceLabel:'变化结果'}],
  fang_gu:[one('选择夜间击杀玩家','选择{targets}作为夜间击杀目标。'),one('首次转化外来者','选择的外来者{targets}变成邪恶的方古，自己代替其死亡。')],
  vigormortis:[one('选择夜间击杀玩家','选择{targets}作为夜间击杀目标。'),one('被杀爪牙保留能力','被自己杀死的爪牙{targets}保留能力。'),one('使被杀爪牙邻近的镇民中毒','被杀爪牙邻近的镇民{targets}中毒。')],
  no_dashii:[one('选择夜间击杀玩家','选择{targets}作为夜间击杀目标。'),many('邻近的两名镇民中毒',2,'与自己邻近的两名镇民{targets}中毒。')],
  vortox:[one('选择夜间击杀玩家','选择{targets}作为夜间击杀目标。'),direct('使镇民获得错误信息','镇民玩家的能力产生错误信息。'),direct('无人被处决触发邪恶胜利','白天无人被处决，邪恶阵营获胜。')],
  deviant:[direct('因表现有趣而免于流放','因表现有趣，当天不能被流放。')],
  bone_collector:[one('恢复死亡玩家的能力','选择死亡的{targets}，使其重新获得能力直到下个黄昏。'),direct('暂不使用能力','当晚暂不使用能力。')],
  butcher:[one('首次处决后再次提名','白天首次处决后，再次提名{targets}。')],
  harlot:[{...one('拜访并得知角色','拜访存活的{targets}，对方同意，得知其角色为{role}。'),roleTeams:any,roleLabel:'得知的角色'},one('拜访被拒绝','拜访存活的{targets}，对方拒绝。'),one('同意拜访后两人死亡','与同意拜访的{targets}一起死亡。')],
  barista:[one('清醒健康并获得正确信息','说书人选择{targets}清醒健康、免受醉酒与中毒且得知正确信息，持续至下个黄昏；已告知其效果。'),one('能力生效两次','说书人选择{targets}的能力可生效两次，持续至下个黄昏；已告知其效果。')],
  // 黯月初升
  grandmother:[{...one('得知孙子与角色','得知善良的{targets}是自己的孙子，其角色为{role}。',true),roleTeams:any,roleLabel:'得知的孙子角色'},one('因孙子被恶魔杀死而死亡','因孙子{targets}被恶魔杀死而一同死亡。',true)],
  sailor:[one('选择共饮玩家','选择存活的{targets}共饮，自己或目标之一醉酒直到下个黄昏。'),one('共饮目标醉酒','共饮的{targets}醉酒直到下个黄昏。'),direct('自己醉酒','因共饮，自己醉酒直到下个黄昏。'),direct('能力阻止死亡','因水手能力而不会死亡。')],
  chambermaid:[{...many('选择玩家并得知唤醒人数',2,'选择{targets}，得知其中有 {number} 人当晚因自身能力被唤醒。',{excludeSelf:true,targetLabel:'除自己以外的两名存活玩家'}),numberLabel:'因自身能力被唤醒的人数',min:0,max:2}],
  exorcist:[{...one('选择驱魔玩家','选择{targets}驱魔。'),hint:'必须与上个夜晚的选择不同；选中恶魔时，对方得知驱魔人是谁，且当晚不因自身能力被唤醒。'},one('选中恶魔并告知身份','选中恶魔{targets}；其得知自己是驱魔人，且当晚不因自身能力被唤醒。')],
  innkeeper:[many('选择保护两名玩家',2,'选择保护{targets}，使其当晚不会死亡；其中一人醉酒直到下个黄昏。'),one('记录保护目标中的醉酒玩家','被保护的{targets}醉酒直到下个黄昏。')],
  gambler:[{...one('猜测玩家的角色','猜测{targets}是{role}。'),roleTeams:any,roleLabel:'猜测的角色'},direct('猜错后死亡','因猜测错误而死亡。')],
  gossip:[info('公开发表声明','公开发表了一条声明。',{resultLabel:'声明内容（必填）'}),one('声明正确导致玩家死亡','因白天声明正确，当晚{targets}死亡。')],
  courtier:[roleOnly('使一个角色醉酒',any,'选择{role}，若该角色在场，其中一名对应玩家从当晚起醉酒三天三夜。'),direct('暂不使用能力','当晚暂不使用能力。')],
  professor:[one('选择死亡玩家复活','选择死亡的{targets}；若其为镇民，将其复活。'),direct('暂不使用能力','当晚暂不使用能力。')],
  minstrel:[one('爪牙被处决触发全场醉酒','爪牙{targets}死于处决，除自己与旅行者以外的其他玩家醉酒直到明天黄昏。')],
  tea_lady:[many('保护邻近的善良玩家',2,'邻近的两名存活玩家{targets}均为善良，因此不会死亡。',{excludeSelf:true,targetLabel:'邻近的两名存活善良玩家'})],
  pacifist:[one('阻止善良玩家被处决死亡','善良的{targets}被处决，但因和平主义者能力而未死亡。')],
  fool:[direct('首次将要死亡时免死','首次将要死亡时，因能力而未死亡。')],
  tinker:[direct('因自身能力死亡','因修补匠能力而死亡。')],
  moonchild:[one('死亡后公开选择玩家','得知自己死亡后，公开选择存活的{targets}；若其为善良，则当晚死亡。'),one('选中的善良玩家死亡','此前选中的善良玩家{targets}在当晚死亡。')],
  goon:[outcome('被首次选择并转变阵营','被{targets}当晚首次以自身能力选择；该玩家醉酒直到下个黄昏，自己变成{choice}。',['善良阵营','邪恶阵营'],{targets:1,targetLabel:'当晚首个用自身能力选择自己的玩家'})],
  lunatic:[roleOnly('以为自己是某个恶魔',['demon'],'以为自己是{role}。'),direct('模拟珀憋刀','模拟珀的行动，没有选择玩家。'),...[1,2,3].map(n=>many('模拟恶魔选择 '+n+' 名玩家',n,'模拟恶魔行动，选择{targets}；选择结果告知真正的恶魔。',{hint:'按疯子以为自己拥有的恶魔能力，选择对应数量的玩家。'})),one('真正的恶魔得知疯子是谁','真正的恶魔{targets}得知自己是疯子。')],
  godfather:[direct('得知没有外来者在场','得知没有外来者角色在场。'),...[1,2,3,4,5].map(n=>({...direct('得知 '+n+' 个在场外来者角色','得知在场的外来者角色为{roles}。'),roleSlots:Array.from({length:n},(_,i)=>({label:'外来者角色 '+(i+1),teams:['outsider']}))})),one('外来者白天死亡后击杀','因外来者在白天死亡，当晚选择{targets}作为击杀目标。')],
  devils_advocate:[{...one('选择处决不死玩家','选择存活的{targets}；若其次日白天被处决，则不会死亡。'),hint:'必须与上个夜晚选择的玩家不同。'}],
  assassin:[one('无视保护刺杀玩家','选择刺杀{targets}，其死亡，即使有能力使其不会死亡。'),direct('暂不使用能力','当晚暂不使用能力。')],
  mastermind:[direct('恶魔被处决后延续游戏','恶魔因死于处决本应令游戏结束，改为额外进行一个夜晚和一个白天。'),one('额外白天处决导致阵营落败','额外的白天，{targets}被处决，其所属阵营落败。'),direct('额外白天无人被处决','额外的白天无人被处决。')],
  zombuul:[{...one('无白天死亡时选择击杀','因今天白天无人死亡，当晚选择{targets}作为击杀目标。'),hint:'仅在今天白天没有人死亡时行动。'},direct('首次死亡后被当作死亡','首次死亡后仍存活，但被当作死亡。')],
  pukka:[one('选择新的中毒玩家','选择{targets}中毒。'),one('上个中毒目标死亡并恢复健康','上个因普卡能力中毒的{targets}死亡并恢复健康。')],
  shabaloth:[many('选择两名击杀玩家',2,'选择{targets}作为当晚的击杀目标。'),one('反刍上一夜的目标','反刍上个夜晚选择过且当前死亡的{targets}，使其复活。')],
  po:[direct('憋刀','当晚没有选择任何玩家，下一次行动须选择三名玩家。'),one('选择一名击杀玩家','选择{targets}作为当晚的击杀目标。'),many('蓄力后选择三名击杀玩家',3,'上次行动没有选择玩家，当晚选择{targets}作为三名击杀目标。')],
  voudon:[direct('改变投票规则','只有自己和死亡玩家可投票，无需投票标记，忽略票数过半的要求。')],
  bishop:[one('记录说书人提名','说书人因主教能力提名{targets}。'),direct('记录提名规则','只有说书人可提名，每个白天至少提名一名与主教对立阵营的玩家。')],
  judge:[one('使提名直接处决','其他玩家发起提名后，裁定{targets}直接被处决。'),one('使提名投票无效','其他玩家发起提名后，裁定针对{targets}的投票无效。')],
  matron:[many('交换一对玩家的座位',2,'选择交换{targets}的座位。',{hint:'每个白天最多三对；每对交换分别添加记录。'}),direct('禁止离座私聊','玩家不能离开座位私聊。')],
  apprentice:[roleOnly('善良学徒获得镇民能力',['townsfolk'],'作为善良学徒，获得{role}的能力。'),roleOnly('邪恶学徒获得爪牙能力',['minion'],'作为邪恶学徒，获得{role}的能力。')]
 });

 // Additional catalog groups. Definitions remain tied to name, type and ability,
 // so matching display names across sources never share a template by accident.
 const nonDemon=['townsfolk','outsider','minion','traveller'];
 const skip=()=>direct('暂不使用能力','本次暂不使用能力。');
 const kill=()=>({...one('选择夜间击杀玩家','选择{targets}作为夜间击杀目标。'),followups:[{effect:'death'}]});
 const range=(label,min,max,sentence,extra={})=>({...many(label,min,sentence,extra),maxTargets:max});
 const withRole=(label,n,teams,sentence,extra={})=>({...many(label,n,sentence),roleTeams:teams,roleLabel:'选择的角色',...extra});
 const choose=(label,n,choices,sentence,extra={})=>({...outcome(label,sentence,choices),targets:n,...extra});
 const slots=(label,teams,sentence)=>({...direct(label,sentence),roleSlots:teams.map((teams,i)=>({label:'角色 '+(i+1),teams}))});
 const roleCount=(label,teams,sentence)=>({...number(label,30,sentence),min:1,numberLabel:'选择的角色数量',roleCount:{teams}});
 const textAction=(label,n,sentence,resultLabel='信息内容（必填）',extra={})=>({...info(label,sentence),targets:n,resultLabel,...extra});
 const alignment=['善良阵营','邪恶阵营'];
 Object.assign(forms,{
  // 实验性
  gnome:[one('进场时公开同阵营玩家','加入游戏时，所有玩家得知{targets}与自己阵营相同。',true),one('杀死该玩家的提名者','同阵营玩家被提名，选择杀死提名者{targets}。')],
  gangster:[many('征得邻居同意后杀死另一邻居',2,'征得{target1}同意，杀死另一侧的{target2}。',{excludeSelf:true,targetLabels:['同意的存活邻居','被杀死的另一侧存活邻居']})],
  lycanthrope:[choose('选择存活玩家',1,['目标善良，死亡且当晚恶魔不造成死亡','未因半兽人能力死亡'],'选择存活的{targets}，{choice}。'),one('标记始终被当作邪恶的玩家','善良的{targets}始终被半兽人能力当作邪恶阵营。')],
  banshee:[direct('被恶魔杀死后觉醒','被恶魔杀死，向所有玩家宣布觉醒；此后每天可提名两次，每次投两票。')],
  choirboy:[one('国王被杀后得知恶魔','因国王被恶魔杀死，得知{targets}是杀死国王的恶魔。')],
  preacher:[one('选择传教玩家','选择{targets}；若其为爪牙，则其得知被传教士选中并失去能力。')],
  villageidiot:[choose('查验玩家阵营',1,alignment,'选择{targets}，得知其为{choice}。'),direct('复数村夫之一醉酒','作为复数村夫中的醉酒村夫。')],
  engineer:[roleOnly('改变恶魔角色',['demon'],'让恶魔变成所选的{role}。'),{...roleCount('改变所有爪牙角色',['minion'],'让所有爪牙变成选择的角色：{roles}。'),allowRepeatedRoles:true},skip()],
  noble:[many('得知一名邪恶所在的三名玩家',3,'得知{targets}中有且只有一名邪恶玩家。')],
  king:[roleOnly('得知一个存活角色',any,'死亡人数大于或等于存活人数，得知存活角色{role}。'),one('恶魔得知国王是谁','恶魔{targets}得知自己是国王。')],
  general:[choose('得知当前优势阵营',0,['善良更有优势','邪恶更有优势','双方均势'],'得知说书人认为当前{choice}。')],
  alchemist:[roleOnly('得知拥有的爪牙能力',['minion'],'得知自己拥有{role}的能力。'),textAction('按说书人要求更换能力选择',0,'使用爪牙能力时，按说书人要求更换选择。','原选择与更换后的选择（必填）')],
  magician:[direct('干扰邪恶相认信息','恶魔以为自己是爪牙，爪牙以为自己是恶魔。')],
  farmer:[one('夜间死亡后产生新农夫','夜晚死亡后，存活的善良玩家{targets}变成农夫。',true)],
  highpriestess:[one('得知最应交流的玩家','得知说书人认为最应该与{targets}交流。')],
  knight:[many('得知两名非恶魔玩家',2,'得知{targets}都不是恶魔。')],
  balloonist:[{...one('得知不同角色类型的玩家','得知{targets}；其角色类型与上个夜晚得知的玩家不同。'),hint:'首个夜晚没有前夜类型限制；不需要得知或公开其具体角色类型。'},one('首夜得知一名玩家','首个夜晚，得知{targets}。')],
  bounty_hunter:[one('得知邪恶玩家','得知{targets}是邪恶玩家。'),one('设置一名邪恶镇民','镇民{targets}因赏金猎人设置而转变为邪恶阵营。')],
  amnesiac:[textAction('猜测能力并得知准确程度',0,'向说书人猜测能力，并得知准确程度。','能力猜测及说书人的反馈（必填）'),textAction('记录自定义能力行动',0,'执行说书人设定的失忆者能力。','本局能力及本次行动（必填）')],
  cannibal:[withRole('获得上个被处决玩家的能力',1,any,'获得上个死于处决的{targets}的{role}能力。'),direct('因邪恶处决对象而中毒','上个死于处决的玩家属于邪恶阵营，自己中毒直到下个善良玩家死于处决。')],
  steward:[one('得知善良玩家','得知{targets}是善良玩家。')],
  nightwatchman:[one('告知玩家自己的身份','选择{targets}，使其得知自己是守夜人。'),skip()],
  atheist:[textAction('记录说书人打破规则',0,'说书人因无神论者而打破游戏规则。','打破规则的具体内容（必填）'),direct('说书人被处决','说书人被处决，善良阵营获胜。')],
  alsaahir:[textAction('公开猜测爪牙与恶魔',0,'公开猜测谁是爪牙、谁是恶魔。','逐名填写爪牙与恶魔猜测（必填）',{menuOrder:10,hint:'自由文字记录，适合其他爪牙或恶魔数量；也可返回操作选项，按猜测人数逐名选择玩家。'}),{...direct('猜测全部正确','公开猜测正确，善良阵营获胜。'),menuOrder:20}],
  pixie:[roleOnly('得知在场镇民',['townsfolk'],'得知在场镇民角色{role}。'),roleOnly('疯狂成功后获得能力',['townsfolk'],'疯狂证明自己是{role}，在该角色死亡后获得其能力。')],
  shugenja:[choose('得知最近邪恶玩家的方向',0,['顺时针','逆时针'],'得知最近的邪恶玩家位于{choice}方向。')],
  huntsman:[one('寻找落难少女','选择存活的{targets}；若其为落难少女，则变成一个不在场的镇民角色。'),withRole('记录落难少女变成的角色',1,['townsfolk'],'选中的落难少女{targets}变成不在场的{role}。'),skip()],
  cult_leader:[choose('转变为邻近玩家的阵营',1,alignment,'转变为邻近存活玩家{targets}的阵营：{choice}。'),textAction('提议玩家加入教派',0,'公开提议所有玩家加入教派。','同意加入的玩家或投票情况（必填）'),direct('所有善良玩家同意入教','所有善良玩家同意入教，所属阵营获胜。')],
  poppy_grower:[direct('阻止恶魔与爪牙相认','恶魔与爪牙互相不认识。'),direct('死亡后恢复邪恶相认','死亡后，当晚恶魔与爪牙互相认识。')],
  fisherman:[textAction('向说书人索取建议',0,'向说书人获取帮助所属阵营获胜的建议。','建议内容（必填）')],
  acrobat:[one('选择查验中毒或醉酒', '选择{targets}；若其当晚醉酒或中毒，自己死亡。'),direct('因目标醉酒或中毒而死亡','所选玩家当晚醉酒或中毒，自己死亡。')],
  snitch:[{...one('爪牙得知三个伪装','爪牙{targets}得知三个伪装：{roles}。'),roleSlots:Array.from({length:3},(_,i)=>({label:'伪装 '+(i+1),teams:good}))}],
  puzzlemaster:[one('设置解谜醉酒玩家','{targets}因解谜大师而醉酒，即使自己已死亡。'),many('猜测醉酒玩家并得知恶魔',2,'猜测{target1}是醉酒玩家，得知{target2}是恶魔（猜错时该信息错误）。',{allowRepeatedTargets:true,targetLabels:['猜测的醉酒玩家','得知的恶魔玩家']})],
  zealot:[direct('五人以上必须投票','至少五名玩家存活，必须在所有提名中投票。')],
  damsel:[direct('告知爪牙落难少女在场','所有爪牙得知落难少女在场。'),one('被爪牙猜中','爪牙{targets}公开猜中自己是落难少女，所属阵营落败。')],
  hatter:[withRole('死亡后记录邪恶玩家的新角色',1,evil,'死亡后，{targets}选择变成同类型的{role}。'),one('死亡后邪恶玩家保留角色','死亡后，{targets}选择保留原角色。')],
  golem:[choose('唯一一次提名',1,['目标非恶魔，死亡','目标为恶魔，未因此死亡'],'使用唯一一次提名机会提名{targets}，{choice}。')],
  ogre:[one('选择同阵营玩家','选择{targets}，转变为其阵营，但不知晓自己转变后的阵营。',true)],
  plague_doctor:[roleOnly('死亡后说书人获得爪牙能力',['minion'],'死亡后，说书人获得{role}的能力。')],
  heretic:[direct('对调胜负结果','因异端分子能力，对调胜负结果。')],
  politician:[direct('为原阵营落败负最大责任','为原阵营落败负最大责任，转变阵营并获胜。')],
  goblin:[direct('被提名后声明哥布林','被提名后公开声明自己是哥布林。'),direct('声明后被处决获胜','被提名后声明哥布林并在当天被处决，所属阵营获胜。')],
  widow:[one('查看魔典并投毒','查看魔典，选择{targets}中毒。'),one('善良玩家得知寡妇在场','善良玩家{targets}得知寡妇在场。')],
  organ_grinder:[choose('选择自己是否醉酒',0,['醉酒直到下个黄昏','不醉酒'],'选择自己{choice}。'),direct('秘密统计闭眼投票','所有玩家闭眼投票，票数秘密统计。')],
  psychopath:[one('白天公开杀死玩家','在白天提名开始前公开选择{targets}，使其死亡。'),choose('被处决时与提名者猜拳',1,['自己输，死亡','自己赢，不死亡','平局，不死亡'],'被处决时与提名者{targets}猜拳，{choice}。')],
  boffin:[withRole('记录恶魔获得的善良能力',1,good,'恶魔{targets}获得不在场的{role}能力，自己与恶魔均已知晓。')],
  fearmonger:[one('选择恐惧目标','选择{targets}；若自己提名且其被处决，其阵营落败。'),direct('向所有人宣布新目标','首次选择或更换目标，所有玩家得知选择了新的玩家。'),one('目标因提名处决而阵营落败','自己提名的目标{targets}被处决，其阵营落败。')],
  mezepheles:[textAction('得知关键词',0,'得知秘密关键词。','关键词（必填）'),one('首个说出关键词的善良玩家转邪恶','首个说出关键词的善良玩家{targets}当晚转变为邪恶阵营。')],
  marionette:[goodRole('以为自己是善良角色','以为自己是{role}。'),one('恶魔得知提线木偶是谁','恶魔{targets}得知自己是提线木偶。')],
  vizier:[direct('向所有人公开身份','所有玩家得知自己是维齐尔。'),direct('白天免死','因维齐尔能力在白天不会死亡。'),one('强制立即处决','该提名中有善良玩家投票，令被提名的{targets}立即被处决。')],
  'image-6':[textAction('向说书人许愿',0,'向说书人许愿。','愿望、实现情况及已知代价／线索（必填）')],
  xaan:[number('记录触发中毒的夜晚',30,'在等同于初始外来者数量的第 {number} 夜，所有镇民中毒直到下个黄昏。')],
  harpy:[many('选择疯狂者与被指控者',2,'选择{target1}明天疯狂证明{target2}是邪恶的，否则他们之中可能有人死亡。',{targetLabels:['需要疯狂证明的玩家','被证明是邪恶的玩家']}),range('未疯狂导致死亡',1,2,'因未疯狂证明，{targets}死亡。')],
  boomdandy:[many('处决后留下三名玩家',3,'被处决后，除{targets}以外的玩家均死亡。'),one('倒数后最多手指指向者死亡','倒数十声后，被最多玩家手指指向的{targets}死亡。')],
  summoner:[slots('得知三个伪装',[good,good,good],'得知三个伪装：{roles}。'),withRole('第三夜召唤邪恶恶魔',1,['demon'],'第三个夜晚，选择{targets}变成邪恶的{role}。')],
  ojo:[{...roleOnly('选择要杀死的角色',any,'选择了{role}作为击杀角色。'),roleLabel:'奥赫选择的角色',hint:'选择角色名称，不是选择玩家。若该角色不在场，可用“选择角色并记录说书人目标”同时记录角色与说书人决定的目标。'}, {...one('记录说书人决定的击杀玩家','所选角色不在场，说书人选择了{targets}作为击杀目标。'),targetLabel:'说书人决定的击杀目标',hint:'用于已另行记录奥赫所选角色的情况。死亡结果需按实际结算另行记录。'},withRole('选择角色并记录说书人目标',1,any,'选择了{role}，因其不在场，说书人选择了{targets}作为击杀目标。',{roleLabel:'奥赫选择的角色',targetLabel:'说书人决定的击杀目标',hint:'选择奥赫报出的角色，再选择说书人决定的玩家；这里只记录目标，死亡结果按实际结算记录。'})],
  riot:[range('第三日爪牙变成暴乱',1,30,'第三个白天，爪牙{targets}变成暴乱。'),many('被提名死亡并继续提名',2,'第三个白天，{target1}被提名后立即死亡，并提名存活的{target2}。',{targetLabels:['被提名后死亡的玩家','接着被提名的存活玩家']})],
  lord_of_typhon:[kill(),withRole('首夜配置爪牙',1,['minion'],'首夜，将相邻邪恶队伍中的{targets}设置为邪恶的{role}。')],
  'al-hadikhia':[many('选择三名玩家决定生死',3,'选择{targets}，公开这些目标并让其分别秘密决定生死；结算后若三人均存活则都死亡。',{targetLabels:['第一名玩家','第二名玩家','第三名玩家']}),choose('记录目标的秘密生死决定',1,['选择生','选择死'],'目标{targets}{choice}。'),range('记录最终死亡玩家',1,3,'能力结算后，{targets}死亡。'),range('记录复活玩家',1,3,'能力结算后，{targets}复活。')],
  legion:[one('说书人决定夜间死亡','说书人决定{targets}当晚死亡。'),direct('无夜间死亡','说书人决定当晚无人因军团能力死亡。'),direct('只有邪恶投票导致无效','该提名只有邪恶玩家投票，投票无效。'),direct('被当作爪牙','被当作爪牙角色。')],
  kazali:[withRole('首夜决定玩家的爪牙角色',1,['minion'],'首夜选择{targets}成为邪恶的{role}。'),kill()],
  leviathan:[number('宣布利维坦在场与天数',30,'告知所有玩家利维坦在场，现在是第 {number} 个白天。'),direct('多于一名善良玩家被处决','多于一名善良玩家被处决，邪恶阵营获胜。'),direct('第五个白天结束获胜','第五个白天结束，邪恶阵营获胜。')],
  lleech:[one('首夜选择宿主','首夜选择存活的{targets}作为宿主，使其中毒；仅当宿主处于死亡状态时自己立即死亡。'),kill(),one('宿主死亡导致自己死亡','宿主{targets}处于死亡状态，自己立即死亡。')],
  lil_monsta:[one('爪牙决定照看者','所有爪牙秘密决定由{targets}照看小怪宝并且“是恶魔”。'),one('说书人决定夜间死亡','说书人决定{targets}当晚死亡。'),direct('无夜间死亡','当晚无人因小怪宝能力死亡。')],
  yaggababble:[textAction('首夜得知秘密短语',0,'得知秘密短语。','秘密短语（必填）'),number('记录白天公开说出短语次数',999,'白天公开说出秘密短语 {number} 次。'),range('短语导致玩家死亡',1,30,'因白天公开说出秘密短语，{targets}在之后死亡。')],
  hermit:[roleOnly('记录拥有的外来者能力',['outsider'],'拥有{role}的能力（另同时拥有其他所有外来者能力）。'),textAction('记录外来者能力行动',0,'执行隐士拥有的外来者能力。','使用的能力及本次行动（必填）')],
  // 华灯初上
  banxian:[many('将选中自己的能力转向邪恶玩家',2,'其他玩家{target1}夜晚使用自身能力选择自己，改为选中邪恶玩家{target2}。',{excludeSelfAt:[0],targetLabels:['原本选择半仙的玩家','替代目标的邪恶玩家']})],
  bianlianshi:[goodRole('疯狂证明新的善良角色','疯狂证明自己是{role}，与之前证明的角色不同。'),goodRole('当晚获得所证明角色的能力','当晚获得{role}的能力，持续至下个黄昏。')],
  dagengren:[{...number('猜测首个夜间死亡者的距离',30,'猜测当晚首个死亡玩家距离自己为 {number}。'),numberLabel:'猜测的距离'},direct('猜对距离触发保护','猜测正确，除自己以外的所有玩家当晚不会死亡，自己可能死亡。'),direct('猜对后自己死亡','猜测正确后，自己被说书人决定死亡。')],
  dianxiaoer:[many('得知两名善良玩家',2,'得知{targets}是善良玩家，其中一人醉酒，即使自己已死亡。'),one('记录两人中的醉酒者','得知的两名善良玩家中，{targets}醉酒。')],
  geling:[range('从同意者中选择观众',1,30,'提议演出后，从同意参加的玩家中选择{targets}作为观众。'),direct('恶魔成为观众后死亡','恶魔成为观众，自己当晚死亡。'),skip()],
  heshang:[direct('得知夜间保护被触发','得知当晚首次选择或影响邻近存活玩家的邪恶能力被阻止，且该能力至下个黎明不生效。')],
  jinyiwei:[one('选择替死保护玩家','选择{targets}；若其在下个黄昏前死亡，自己代替其死亡。'),one('代替保护目标死亡','代替受保护的{targets}死亡。')],
  langzhong:[textAction('选择玩家并得知能力词语',1,'选择{targets}，得知与其能力相关的词语。','得知的词语（必填）',{excludeSelf:true})],
  qintianjian:[choose('得知最近邪恶玩家位于哪侧',0,['左侧','右侧','两侧相同'],'得知最近邪恶玩家方向为{choice}；若邻近玩家中有邪恶，信息改为错误。')],
  wudaozhe:[roleOnly('以为自己是外来者',['outsider'],'以为自己是{role}。'),roleOnly('受邪恶能力影响后变化',['townsfolk'],'被邪恶能力选择或影响，立即变成不在场的{role}。')],
  xizi:[range('戏子互相认识',1,30,'与其他戏子{targets}互相认识。',{excludeSelf:true}),direct('对调胜负结果','因戏子能力对调胜负结果，不论戏子人数或存活与否。')],
  yinyangshi:[slots('得知两善良两邪恶角色',[good,good,evil,evil],'得知{roles}，其中有且只有两个角色在场。')],
  xionghaizi:[roleOnly('使镇民信息错误',['townsfolk'],'选择{role}，其能力产生错误信息直到下个黄昏。')],
  nichen:[one('首夜选择不共戴天玩家','首夜选择{targets}；两人中先死于处决者会使另一人当晚转邪恶。',true),direct('目标先被处决自己转邪恶','目标先死于处决，自己当晚转变为邪恶。'),one('自己先被处决目标转邪恶','自己先死于处决，目标{targets}当晚转变为邪恶。')],
  shaxing:[one('死亡后邻近玩家随之死亡','死亡后，邻近的存活玩家{targets}在当晚死亡。')],
  shijie:[many('将邪恶目标改为自己',2,'{target1}使用自身能力选择邪恶玩家{target2}，此次目标改为自己。',{allowRepeatedTargets:true,targetLabels:['使用能力的玩家','原本选中的邪恶玩家']})],
  shusheng:[direct('恶魔得知书生在场','恶魔得知书生在场。'),one('恶魔成功猜中书生','恶魔{targets}拜访说书人并成功猜中自己是书生。'),many('猜中后恶魔额外杀人',2,'猜中书生的恶魔{target1}当晚额外选择{target2}死亡。',{allowRepeatedTargets:true,targetLabels:['猜中书生的恶魔','额外击杀目标']})],
  ganshiren:[one('邻近镇民首次死亡仍被当作存活','邻近镇民{targets}首次死亡，仍被当作存活。')],
  humeiniang:[one('首夜选择被魅惑玩家','选择{targets}，使其知道狐媚娘在场。'),one('处决后使被魅惑者转邪恶','自己死于处决，被魅惑的{targets}当晚转变为邪恶。')],
  jinweijun:[one('处决疯狂想死亡者','{targets}疯狂想要死亡，被立即处决。')],
  yangguren:[one('杀死存活时提名自己者','{targets}在自己存活时提名自己，因此在当晚死亡，即使自己已死亡。')],
  hundun:[kill(),direct('杀死邻近镇民导致善良中毒','杀死邻近镇民，除旅行者外的所有善良玩家中毒直到下个黄昏。')],
  // Imported scripts also use this complete ability definition, with a different poison scope.
  hundun_all_good:[kill(),direct('杀死邻近镇民导致善良中毒','杀死邻近镇民，所有善良玩家中毒直到下个黄昏。')],
  qiongqi:[kill(),one('外来者白天死亡后制造活尸','今天白天有外来者死亡，选中的{targets}死亡但被当作仍存活。'),one('制造活尸后另一玩家死亡','制造活尸后，其他玩家{targets}死亡。')],
  taotie:[range('选择非旅行者目标',0,30,'选择非旅行者玩家{targets}；若其角色类型均不相同，则均死亡。',{excludeTravellers:true,emptySentence:'当晚没有选择任何非旅行者玩家。'}),{...one('选择一名旅行者','选择旅行者{targets}死亡。'),targetTeams:['traveller']}],
  taowu:[kill(),one('以爪牙失能替代自己死亡','自己将要死亡时，改为存活且具有能力的爪牙{targets}失去能力。'),direct('不获得恶魔信息','不获得恶魔信息。')],
  jiaohuazi:[withRole('公开请玩家选择借用能力',1,nonDemon,'公开选择{targets}，由其选择{role}；自己可能获得该能力直到下个黎明。',{excludeSelf:true})],
  // 山雨欲来
  diaomin:[one('令粗暴打断者醉酒','曾在白天粗暴打断自己发言的{targets}当晚醉酒，即使自己已死亡。')],
  bingbi:[one('白天死亡后得知善良玩家','白天死亡后，当晚得知{targets}是善良玩家。'),one('夜晚死亡后得知邪恶玩家','夜晚死亡后，当晚得知{targets}是邪恶玩家。')],
  chongfei:[textAction('得知说书人为自己打破的规则',0,'秘密得知说书人为自己打破了规则。','打破规则的具体内容（必填）')],
  daoke:[roleOnly('首夜得知在场爪牙',['minion'],'得知在场爪牙角色{role}。'),choose('白天公开选择追杀目标',1,['目标是得知的角色，死亡','未因此死亡'],'白天公开选择{targets}，{choice}。')],
  daoshi:[one('夜晚选择玩家','选择{targets}；若其为恶魔，自己死亡且其醉酒直到下个黎明。'),one('选中恶魔后同归于醉','选中恶魔{targets}，自己死亡，其醉酒直到下个黎明。')],
  fangshi:[{...number('首夜选择信息夜晚',30,'首夜选择数字 {number}，在对应夜晚得知相同数量的在场角色。'),min:1,numberLabel:'选择的数字'},roleCount('对应夜晚得知在场角色',any,'在对应夜晚，得知 {number} 个在场角色：{roles}。')],
  fengshuishi:[choose('得知顺时针下一玩家的类型',1,['镇民','外来者','爪牙','恶魔','旅行者'],'得知{targets}的角色类型为{choice}；之后沿顺时针移动至下一名非旅行者。',{hint:'首夜从起点开始；此后按顺时针顺序，不直接得知具体角色。'})],
  limao:[one('选择太子玩家','选择{targets}；若其为善良角色且当晚被邪恶角色杀死，自己与其交换角色。'),one('触发交换角色','所选善良角色{targets}当晚被邪恶角色杀死，自己与其交换角色。')],
  qianke:[many('选择两名存活玩家互换目标',2,'选择存活的{targets}；若两人阵营相同，当晚自身能力选中其中一人时改为选中另一人。')],
  ranfangfangzhu:[direct('夜间死亡后改变恶魔能力','夜晚死亡，恶魔能力变成“每个夜晚*，可能会有一名玩家死亡。”'),one('记录改变后的恶魔死亡','恶魔能力改变后，{targets}在夜晚死亡。')],
  shiguan:[number('得知存活镇民数量',30,'今天有玩家死于处决，得知存活镇民有 {number} 名。')],
  tixingguan:[withRole('得知首次提名目标的角色',1,any,'得知首次提名的{targets}是{role}。',{targetLabel:'首次提名的玩家',roleLabel:'说书人告知的角色',hint:'先选本局首次提名的玩家，再选说书人实际告知的角色。恶魔会被当作善良角色；表单保留所有角色，便于记录中毒、醉酒等情况下实际收到的信息。'})],
  xuncha:[{...slots('保护两个善良角色',[good,good],'选择{roles}；若其都存活，则当晚都不会死亡。'),hint:'两个角色都须与上个夜晚的选择不同。'}],
  yanshi:[one('夜间死亡后与爪牙交换角色','夜晚死亡后，与存活爪牙{targets}交换角色。',true)],
  xizi_revised:[range('善良玩家互认',1,30,'与除旅行者以外的善良玩家{targets}互相认识，其他善良玩家醉酒且无法转变阵营。',{excludeSelf:true,excludeTravellers:true}),direct('对调胜负结果','对调胜负结果，即使已经失去能力。')],
  yishi:[roleOnly('白天声明角色在场',any,'白天公开声明{role}在场。'),{...roleOnly('当晚得知声明真假',any,'得知白天声明的{role}{choice}。'),choices:['在场','不在场'],choiceLabel:'得知的结果'},direct('得知过是与否后失去能力','已经得知过是和否，失去此能力。')],
  yinluren:[choose('选择至多三名玩家查验邪恶影响',0,['有邪恶能力选择或影响','没有邪恶能力选择或影响'],'选择{targets}，得知今晚他们之中{choice}。',{maxTargets:3,excludeSelf:true,emptySentence:'当晚未选择玩家，得知{choice}。'})],
  yongjiang:[direct('无死亡邪恶时免受其他死亡','已死亡玩家中没有邪恶玩家，只会死于处决。')],
  zhen:[roleOnly('选择镇民中毒并死亡',['townsfolk'],'选择{role}；若其在场，则中毒并死亡。'),skip()],
  zhifu:[choose('得知是否有非镇民非旅行者死亡',0,['有','没有'],'得知今天{choice}非镇民且非旅行者的玩家死亡。')],
  jiubao:[one('使邻近善良非旅行者醉酒','与自己邻近的善良非旅行者{targets}醉酒，即使自己死于处决。')],
  rulianshi:[withRole('提名处决恶魔后接替',1,['demon'],'提名的恶魔{targets}死于该次处决，自己变成邪恶的{role}。'),direct('四人以下失去能力','除旅行者外的存活人数小于或等于四人，失去此能力。')],
  shutong:[one('首夜选择关联玩家','选择{targets}；此后夜晚其被邪恶能力选择或影响时，自己当晚死亡。',true),one('关联玩家受邪恶影响导致自己死亡','首夜后，关联玩家{targets}被邪恶能力选择或影响，自己当晚死亡。')],
  huapi:[one('选择存活玩家成为活尸','选择存活的{targets}，其死亡但被当作存活。'),one('活尸重生并重获能力','活尸{targets}下一次将要死亡时重生，自己重新获得能力。')],
  gudiao:[withRole('得知下个存活镇民并投毒',1,['townsfolk'],'得知当前方向上下个存活镇民{targets}是{role}，其至下个黄昏中毒且可能被当作邪恶蛊雕。'),direct('使用唯一一次改变方向','改变查找存活镇民的方向，每局游戏限一次。')],
  jinweijun2:[choose('首夜选择求生或求死',0,['存活','死亡'],'首夜选择{choice}，疯狂想这样做的玩家可能立即被处决。'),one('处决符合疯狂条件的玩家','{targets}疯狂想达成自己所选的状态，被立即处决。')],
  mengpo:[choose('选择存活玩家并记录二选一',1,['能力描述改为“你没有能力。”','死亡并保留能力直到下个黄昏'],'选择存活的{targets}，其决定{choice}。'),skip()],
  niangjiushi:[textAction('选择镇民并指定其下次信息',0,'选择{role}，其下次通过自身能力获取信息时改为得知自己提供的信息。','提供的信息（必填）',{roleTeams:['townsfolk'],roleLabel:'选择的镇民角色'})],
  baojun:[kill(),range('满足条件后选择至多两名目标',0,2,'因上夜杀死了与爪牙邻近的玩家，当晚选择{targets}作为击杀目标。',{hint:'以当前能力描述为准：额外目标条件是杀死与爪牙邻近的玩家。'})],
  dianyuzhang:[range('选择至多三名囚禁玩家',0,3,'选择囚禁{targets}，等待明天白天处决结果结算。',{emptySentence:'当晚没有选择囚禁玩家。'}),range('囚犯被处决后杀死其余囚犯',1,2,'上次所选囚犯之一死于处决，其余被囚禁的{targets}当晚死亡。'),one('无人因处决触发时杀死一名囚犯','未触发囚犯处决条件，上次所选的{targets}当晚死亡。')],
  guhuoniao:[kill(),roleOnly('获得被处决爪牙的能力',['minion'],'在爪牙死于处决后，获得{role}的能力，每局游戏限一次。')],
  jianning:[kill(),many('死亡爪牙选择额外目标',2,'当晚死亡的爪牙{target1}选择{target2}；若目标善良，则目标死亡。',{allowRepeatedTargets:true,targetLabels:['当晚死亡的爪牙','爪牙选择的目标'],hint:'以当前能力描述为准，不使用旧提醒中“白天未投票选两人”的条件。'})],
  yanluo:[one('首夜查看魔典并指定第三夜必死者','首夜查看魔典并选择{targets}；其在第三个夜晚死亡，即使有任何免死原因。'),one('每夜选择延迟死亡目标','选择{targets}；该玩家在下个夜晚死亡。'),one('结算上夜选择的目标','上个夜晚选择的{targets}当晚死亡。')]
 });
 Object.assign(forms,{
  // 奥德赛：按该来源的能力定义，独立于其他来源的同名角色。
  '080':[one('提名的善良玩家处决不死','自己发起提名的其他善良玩家{targets}不会死于该次处决。',true)],
  '041':[direct('死后使用投票标记','曾使用投票标记投票，游戏结束时对调胜负结果。')],
  '094':[choose('得知处决者与提名者是否同阵营',2,['同一阵营','不同阵营'],'得知当天死于处决的{target1}与提名者{target2}属于{choice}。',{allowRepeatedTargets:true,targetLabels:['当天死于处决的玩家','提名该玩家的人']})],
  '075':[choose('得知两名玩家的类型排除线索',2,['都不是爪牙','都不是恶魔'],'得知{targets}{choice}。',{hint:'两类线索每夜交替。'})],
  '092':[one('得知符合条件的玩家','得知{targets}是邪恶玩家，或其与两名邪恶玩家的距离相等。')],
  '067':[many('限制恶魔只能攻击邻近两人',2,'邻近的两名存活玩家{targets}阵营相同，恶魔只能攻击他们。',{excludeSelf:true})],
  '081':[one('首位或末位提名触发暗杀','作为首位或末位提名者，提名邪恶的{targets}，其当晚死亡。')],
  '091':[choose('得知提名对象是否恶魔',1,['是恶魔','不是恶魔'],'提名其他玩家{targets}后，当晚得知其{choice}。',{excludeSelf:true})],
  '086':[choose('得知其他镇民是否均正常生效',0,['均正常生效','并非均正常生效'],'得知当天其他镇民玩家的能力{choice}。')],
  '085':[withRole('首次提名时公开质问角色',1,any,'首次提名{targets}时，公开质问其是否为{role}。'),direct('被质问者说谎导致自己被处决','被质问者说谎，自己立即被处决。')],
  '050':[choose('查验邻座玩家中是否有爪牙',2,['有爪牙','没有爪牙'],'选择互相邻座的{targets}，得知其中{choice}。',{excludeSelf:true,targetLabel:'除自己外、互相邻座的一对玩家'})],
  '093':[roleOnly('得知在场角色',any,'得知在场角色{role}。'),direct('邪恶玩家死亡后醉酒','因邪恶玩家死亡而醉酒。')],
  '090':[{...one('选择其他玩家比较角色类型','选择{targets}；若其类型与上夜目标相同，则其死亡。',true),hint:'目标必须与上个夜晚不同。'}],
  '013':[one('无人死于处决时选择玩家','当天无人死于处决，选择{targets}；若其为爪牙，则其死亡。')],
  '104':[one('将恶魔攻击转向存活邪恶玩家','恶魔攻击自己时，存活的邪恶玩家{targets}代替自己被攻击。')],
  '109':[roleOnly('首次被恶魔攻击后得知角色',['demon'],'首次被恶魔攻击时没有死亡，得知该恶魔为{role}。')],
  '003':[one('首夜得知一名玩家','首夜得知{targets}；其与死亡时得知的玩家中一名是爪牙、另一名是外来者。'),one('夜间死亡后得知另一名玩家','夜间死亡后，得知{targets}；其类型与首夜得知者在爪牙／外来者之间互补。')],
  '012':[one('选择弹刀保护目标','选择{targets}；若其当晚被恶魔攻击，存活邪恶玩家代替其被攻击且自己重获能力。'),one('记录替代攻击的邪恶玩家','存活邪恶玩家{targets}代替受保护目标被恶魔攻击，自己重获能力。'),skip()],
  '005':[range('白天公开选择玩家',0,30,'白天公开选择存活的{targets}；其中镇民醉酒直到自己再次选择。',{emptySentence:'白天公开选择不包含任何玩家，此前的选择被替换。'}),number('当晚得知正因自己醉酒的人数',30,'得知正因自己醉酒的玩家有 {number} 名。')],
  '072':[{...number('得知邪恶玩家与自己的距离',30,'得知一名邪恶玩家距离自己为 {number}。'),min:1}],
  '030':[choose('选择其他玩家进行射击',1,['目标是爪牙，目标死亡','目标是镇民，自己死亡','未因该能力造成死亡'],'选择{targets}，{choice}。',{excludeSelf:true}),skip()],
  '025':[one('爪牙被处决后殉教','爪牙{targets}死于处决，自己当晚死亡，所有邪恶角色醉酒直到明天黄昏。')],
  '043':[direct('因邪恶玩家导致死亡','死于邪恶玩家发起的提名处决或能力，等待审判日复活。'),direct('审判日复活','因之前被邪恶玩家杀死，审判日降临时复活。')],
  '048':[choose('得知恶魔相对处决者的方向',1,['左侧','右侧'],'得知恶魔更接近当天被处决的{targets}的{choice}。'),direct('邪恶被处决后醉酒','邪恶玩家被处决，自己醉酒直到下个黎明。')],
  '101':[one('接受赞美并给予保护','公开接受其他玩家{targets}的赞美，邪恶角色能力对其无效直到接受另一人的赞美。',true)],
  '098':[one('首次死后投票立即处决','死后首次投票，当前被提名的{targets}立即被处决。')],
  '004':[many('选择一人并得知另外两人',3,'选择{target1}后，得知{target2}和{target3}；这三名玩家的角色类型各不相同。',{excludeSelfAt:[0],targetLabels:['主动选择的其他玩家','得知的第一名玩家','得知的第二名玩家']}),skip()],
  '002':[one('选择击杀并阻止恶魔攻击','选择{targets}死亡，当晚恶魔不能攻击。'),one('杀死恶魔后交换角色阵营','杀死恶魔{targets}，与其交换角色和阵营。'),skip()],
  '087':[one('提名目标夜间死亡后追加击杀','被自己提名的玩家当晚死亡，被唤醒后选择{targets}死亡。')],
  '028':[one('首夜告知一名爪牙牛仔在场','首夜，爪牙{targets}得知牛仔在场。'),direct('关联爪牙提名后被唤醒','关联爪牙发起提名，当晚被唤醒。'),one('首次互相提名立即处决','自己与关联爪牙中，{targets}首次被另一方提名，立即被处决。')],
  '014':[textAction('从两种能力中选择一种',0,'选择说书人展示的两种能力之一，替代原能力。','两种能力及最终选择（必填）')],
  '049':[one('被自己提名处决的镇民得知灵媒','镇民{targets}死于自己发起的提名处决，当晚其得知灵媒在场。')],
  '029':[one('玩家公开申请探险','未曾探险的{targets}白天公开申请探险。'),many('探险者存活后得知对立玩家',2,'探险者{target1}当晚存活，得知{target2}与其阵营对立。',{targetLabels:['当天申请探险的玩家','得知的对立阵营玩家']})],
  '042':[choose('选择玩家并得知花色',1,['黑桃','红心','梅花','方块'],'选择{targets}，得知其花色为{choice}。',{excludeSelf:true,hint:'花色与角色类型的对应关系为秘密设置，不自动推断或公布。'})],
  '001':[roleOnly('首夜得知在场角色',any,'首夜得知在场角色{role}。'),one('选择玩家验证最近角色','选择{targets}；若其为最近得知的角色，则得知另一个在场角色。'),withRole('选中后得知另一个在场角色',1,any,'选择的{targets}是最近得知的角色，得知另一个在场角色{role}。')],
  '105':[roleOnly('得知最近的爪牙角色',['minion'],'首夜得知距离自己最近的爪牙角色{role}。')],
  '011':[choose('首个白天互通角色后查验说谎',1,['有人说谎','无人说谎'],'与{targets}在说书人见证下互通角色，随后私下得知{choice}。')],
  '006':[many('死亡当晚得知四种角色类型玩家',4,'死亡当晚得知镇民{target1}、外来者{target2}、爪牙{target3}和恶魔{target4}。',{targetLabels:['得知的镇民','得知的外来者','得知的爪牙','得知的恶魔']}),direct('被善良玩家导致死亡而醉酒','死于善良玩家发起的提名处决或能力，自己醉酒。')],
  '100':[one('存活首夜得知一名玩家','存活的首个夜晚得知存活的{targets}。'),one('死亡首夜得知对立阵营玩家','死亡的首个夜晚得知存活的{targets}，其与之前得知者阵营对立。')],
  '069':[textAction('白天得知一种角色类型的信息',0,'向说书人获取关于一种角色类型的信息；若该类型人数异常，信息改为错误。','角色类型及得知的信息（必填）')],
  '023':[one('选择玩家得知调香师在场','选择{targets}，其得知调香师在场。'),roleOnly('选择邪恶角色得知调香师在场',evil,'选择{role}，该角色得知调香师在场。'),skip()],
  '051':[withRole('恶魔选择玩家并双方得知角色',1,any,'恶魔选择存活的{targets}，自己与恶魔得知其角色是{role}。',{excludeSelf:true})],
  '079':[direct('被恶魔杀死后激活能力','被恶魔杀死，此后每夜可以选择玩家死亡。'),one('死后每夜选择玩家死亡','被恶魔杀死后，在夜晚选择{targets}死亡。')],
  '102':[choose('选择死亡玩家查验阵营',1,alignment,'选择已死亡的{targets}，得知其为{choice}。'),one('选择存活玩家未获得阵营','选择存活的{targets}，未因此得知阵营。')],
  '021':[textAction('白天获取新闻',0,'向说书人获取一条新闻。','新闻内容（必填）'),textAction('公开宣读后得知新闻真假',0,'白天公开宣读新闻，当晚得知其{choice}。','宣读的新闻（必填）',{choices:['是事实','不是事实'],choiceLabel:'得知的结果'})],
  '082':[direct('审判日前选择保护自己','审判日降临前，选择自己当晚不会死亡。'),many('审判日前保护邻近两人',2,'审判日降临前，选择邻近的两名存活玩家{targets}当晚不会死亡。',{excludeSelf:true})],
  '070':[textAction('得知指向在场角色的谜语',0,'向说书人获取谜语，谜底指向一个在场角色。','谜语内容（必填）')],
  '022':[slots('得知一外来者一爪牙',[['outsider'],['minion']],'得知{role1}和{role2}，其中有且只有一个角色在场。')],
  '076':[one('爪牙被处决但免死醉酒','爪牙{targets}被处决但不死亡，并因酒娘而醉酒，即使自己已死亡。')],
  '060':[one('得知与前夜阵营不同的玩家','得知{targets}，其与上个夜晚得知的玩家阵营不同。'),one('首夜得知一名玩家','首个夜晚，得知{targets}。')],
  '077':[direct('首次将死免死并使镇民醉酒','首次将要死亡时没有死亡，所有镇民醉酒直到明天黄昏。')],
  '099':[withRole('提名关联的邪恶玩家换妆',1,evil,'因提名关联，{targets}当晚选择变成不在场的同类型{role}。'),one('提名关联的邪恶玩家不换妆','因提名关联，{targets}获得换妆机会但选择不变更角色。')],
  '053':[choose('转变为上个处决者的对立阵营',1,alignment,'审判日前，转变为上个死于处决的{targets}的对立阵营：{choice}。')],
  '032':[one('被爪牙拥立后与恶魔交换','被爪牙公开拥立，立即变成邪恶并与恶魔{targets}交换角色，原恶魔醉酒。')],
  '033':[one('设置被当作恶魔的风车','{targets}被镇民能力当作恶魔角色，即使自己已死亡。'),one('得知当前风车是谁','向说书人得知{targets}是当前风车，随后风车会改变。'),one('更换风车玩家','风车更换为{targets}。')],
  '007':[many('首次将死由两人替死',2,'首次将要死亡时，存活的{targets}代替自己死亡。',{excludeSelf:true})],
  '045':[one('设置中毒玩家','{targets}因养蜂人能力中毒，即使自己已死亡。'),one('夜间选择解除中毒','选择{targets}；若其因自己中毒，则其恢复健康。')],
  '096':[direct('首夜首日镇民信息错误','首个夜晚与首个白天，镇民能力一定产生错误信息。')],
  '097':[one('首夜选择殉情对象','首夜选择其他玩家{targets}；两人之一死亡后，另一人随时可能死亡。',true),one('因关联对象死亡而死亡','关联对象{targets}死亡后，自己因殉情者能力死亡。'),one('自己死亡后关联对象死亡','自己死亡后，关联对象{targets}因殉情者能力死亡。')],
  '107':[number('审判日得知外来者人数',30,'审判日向说书人得知外来者玩家有 {number} 名。')],
  '066':[direct('首夜转变为邪恶','首夜转变为邪恶，获得所有不在场爪牙的能力。'),roleCount('得知获得的所有爪牙能力',['minion'],'得知拥有的不在场爪牙能力：{roles}。')],
  '055':[one('死亡玩家交票成为寻宝人','死亡玩家{targets}上交投票标记，成为寻宝人。'),textAction('审判日分配十二枚投票标记',0,'审判日降临时自己已死亡，所有寻宝人平分十二枚投票标记。','寻宝人及分配结果（必填）')],
  '027':[roleOnly('其他狼孩均死后变邪恶爪牙',['minion'],'其他狼孩均死亡，变成邪恶的不在场{role}。')],
  '044':[one('设置醉酒玩家','{targets}因猫猫合唱团而醉酒。'),textAction('黄昏指定歌曲',0,'说书人指定一首歌曲。','指定的歌曲（必填）'),direct('合唱成功使镇民清醒健康','玩家们成功合唱，所有镇民免受中毒醉酒影响直到下个黄昏。')],
  '015':[one('使疯狂想存活者处决不死','疯狂想要存活的{targets}被处决但没有死亡，每局游戏限一次。')],
  '052':[withRole('接替唯一存活的邪恶玩家',1,any,'审判日前，唯一存活的邪恶玩家{targets}死亡，自己变成其角色{role}与阵营。')],
  '059':[one('杀死首次提名自己的玩家','首次被其他玩家{targets}提名，其死亡。',true),withRole('杀死邪恶提名者后交换身份',1,any,'杀死邪恶提名者{targets}，自己变成其角色{role}与阵营。')],
  '095':[roleOnly('以为自己是镇民',['townsfolk'],'以为自己是{role}。'),direct('死亡后下次处决不致死','自己死亡后，下次处决不会造成死亡。')],
  '068':[one('自己或爪牙处决后保留能力','自己或爪牙{targets}死于处决后保留能力。')],
  '026':[one('被恶魔猜中雪怪','恶魔{targets}公开猜中自己是雪怪，当天其被处决时自己代替其被处决。'),direct('代替恶魔被处决','代替当天猜中自己的恶魔被处决。'),direct('无人被处决导致落败','白天没人被处决，所属阵营落败。')],
  '054':[one('得知当事人','得知{targets}为当事人，下个白天两人中一人被处决时另一人可能替代。'),many('记录替代处决',2,'{target1}代替{target2}被处决。',{targetLabels:['实际被处决者','原本应被处决者']})],
  '035':[{...one('按玩家记录本次重复选择次数','第 X 夜对{targets}选择 {number} 次；一次则中毒到下个黄昏，多次则死亡。'),numberLabel:'对该玩家的选择次数',min:1,max:99,hint:'每名目标分别记录；本次所有目标的选择次数之和须等于自己入场后的夜晚数 X。'},skip()],
  '056':[withRole('杀死玩家并变成其角色',1,any,'选择{targets}死亡，并变成其角色{role}。'),skip()],
  '037':[one('配置另一名双头巨人','选择{targets}成为另一名双头巨人。',true),range('同伴死亡后其他双头巨人死亡',1,30,'一名双头巨人死亡，其余双头巨人{targets}当晚死亡。'),direct('双头巨人同时投票','所有双头巨人一起投票，本次投票有效。')],
  '103':[one('杀死当天互相提名的玩家','选择当天被自己提名或提名过自己的{targets}，使其死亡。'),skip()],
  '057':[one('选择中毒并延迟死亡的玩家','选择{targets}，使其中毒且死亡延迟，直到改变选择。')],
  '112':[roleOnly('以为自己是镇民',['townsfolk'],'以为自己是{role}。')],
  '034':[roleOnly('选择非恶魔角色死亡',nonDemon,'选择{role}；若其在场则死亡。'),withRole('不在场时选择玩家变成该角色',1,nonDemon,'选择的{role}不在场，改为选择{targets}变成该角色。'),skip()],
  '064':[direct('邻座存活时使镇民信息错误','与自己邻座的玩家均存活，镇民能力一定产生错误信息。')],
  '008':[roleOnly('选择被公开提问的角色',any,'选择{role}，下个白天若其在场则会被公开询问一个是非问题。'),textAction('记录公开问题与回答',1,'向{targets}公开询问是非问题。','问题及玩家回答（必填）'),one('未答对问题而被处决','未答对问题的{targets}被处决。')],
  '061':[range('顺时针镇民中毒',1,30,'顺时针最近的 1+X 名镇民{targets}中毒；X 为因自己减少的外来者数量。')],
  '046':[number('处决后声明并记录下次票数',999,'死于处决后立即公开声明百臂巨人，下次投票计为今天获得的 {number} 票。')],
  '036':[withRole('选择玩家得知角色并告知恶魔',1,any,'选择{targets}，自己与恶魔得知其角色为{role}；若其为外来者，则其得知独眼巨人在场。')],
  '084':[withRole('选择玩家与外来者角色',1,['outsider'],'选择{targets}与{role}；该角色不在场时目标变成该角色，若目标本就是该角色则死亡。')],
  '111':[many('处决后邻近两镇民中毒',2,'被处决者邻近的两名镇民{targets}中毒直到明天黄昏。'),direct('无人被处决使全体镇民中毒','白天无人被处决，所有镇民中毒直到明天黄昏。')],
  '024':[goodRole('以为自己是善良角色','以为自己是{role}。'),many('被恶魔杀死后产生新玩偶',2,'自己被恶魔杀死，恶魔{target1}选择{target2}变成玩偶。',{allowRepeatedTargets:true,targetLabels:['杀死玩偶的恶魔','新玩偶玩家']})],
  '083':[direct('存活时阻止善良获胜','自己存活，善良阵营无法获胜。'),one('处决死亡的恶魔黎明重获能力','死于处决的恶魔{targets}在黎明时重获能力。')],
  '071':[{...slots('选择四种类型的角色',[any,any,any,any],'选择{roles}；每个不在场角色分别由一名同类型玩家变成。'),distinctRoleTypes:true},withRole('记录同类型玩家变成指定角色',1,any,'同类型的{targets}变成所选的不在场{role}。'),skip()],
  '113':[one('回答自己问题者死亡','{targets}回答自己的问题，因达摩能力死亡。'),direct('回答其他玩家问题后死亡','回答其他玩家的问题，因达摩能力死亡。'),direct('免于其他原因的死亡','因达摩能力不会死于其他原因。')],
  '074':[choose('第X夜决定是否使距离X者中毒',0,['令对应距离的玩家中毒','不令对应距离的玩家中毒'],'第 {number} 夜，选择{choice}，持续到下个黄昏。',{numberLabel:'本夜 X',min:1,max:99})],
  '062':[one('存活首夜选择中毒者','存活的首个夜晚选择{targets}中毒。'),one('死亡首夜选择中毒者','死亡的首个夜晚选择{targets}中毒。')],
  '073':[textAction('夜晚得知一个字',0,'得知出自同一句诗词的一个字。','得知的字（必填）'),one('首次吟诵诗词者立即被处决','首次吟诵该诗词的存活玩家{targets}立即被处决，即使自己已死亡。')],
  '017':[one('选择持续中毒目标','选择{targets}中毒，直到改变选择。'),one('存活目标恢复健康并得知身份','因自己中毒的存活玩家{targets}恢复健康，得知麻醉师在场。')],
  '009':[one('镇民选中自己后被转化','镇民{targets}使用自身能力选择自己，立即变成麻风侏儒，自己失去所有能力。'),direct('与邪恶玩家共享胜负条件','自己的胜负条件与邪恶玩家相同，即使已经死亡。')],
  '016':[withRole('得知死亡外来者并猜测角色',1,['outsider'],'得知当天死亡的外来者{targets}，猜测其为{role}。'),one('猜中后玩家死亡','猜中死亡外来者的角色，{targets}死亡。')],
  '019':[kill(),one('首次攻击爪牙后交换角色','首次攻击爪牙{targets}，与其交换角色。'),many('交换后两名存活玩家替代被攻击',2,'首次攻击爪牙并交换角色后，存活的{targets}代替被攻击。')],
  '089':[kill(),direct('审判日前死亡变为假死','审判日降临前死亡，改为假死；此后只能杀死邻近的存活玩家。'),one('假死时攻击邻近玩家','假死状态下，选择邻近的存活玩家{targets}死亡。')],
  '010':[range('连续选择击杀目标',1,30,'依次选择{targets}作为击杀目标；每次选中邪恶玩家后继续选择。',{hint:'按实际选择顺序勾选；被杀死的爪牙保留能力。'}),one('被杀爪牙保留能力','被自己杀死的爪牙{targets}保留能力。')],
  '063':[one('说书人决定夜间死亡','说书人决定{targets}当晚死亡。'),one('呼唤爪牙接替劣魔','被提名后呼唤同伴；存活邪恶人数更少，爪牙{targets}变成劣魔。')],
  '088':[roleCount('选择累计数量的击杀角色',any,'选择击杀角色：{roles}；每个不在场角色令下个夜晚额外增加一个选择。')],
  '018':[choose('选择击杀并决定是否谢幕',1,['永久失去使镇民信息错误的能力','保留使镇民信息错误的能力'],'选择{targets}死亡，并选择{choice}。')],
  '038':[one('选择未曾被自己选中过的死亡玩家','选择此前未被大巫妖选中过的死亡玩家{targets}，由其选择两名玩家死亡。'),many('死亡代理人选择两名玩家',3,'死亡代理人{target1}选择{target2}和{target3}死亡。',{allowRepeatedTargets:true,distinctTargetGroups:[[1,2]],targetLabels:['被选中的死亡玩家','第一名击杀目标','第二名击杀目标']}),one('不选择代理人时的死亡','未选择死亡代理人，{targets}当晚死亡。')],
  '040':[{...roleOnly('获得另一个恶魔角色的能力',['demon'],'选择{role}，获得其能力直到下个黄昏。'),roleExcludeNames:['奇美拉'],hint:'不能选择奇美拉，也不能与前两次的选择相同。'}],
  '065':[kill(),goodRole('从额外伪装中获得能力','恶魔信息时从额外伪装中选择{role}并获得其能力。')],
  '110':[many('选择两名击杀玩家',2,'选择{targets}死亡；若白天有善良玩家死亡，则其中一人不会死亡。'),one('记录当晚免死的目标','因白天有善良玩家死亡，当晚所选的{targets}不会死亡。')],
  '020':[one('选择必死玩家','选择{targets}，其必死。'),direct('死亡外来者共享胜负条件','死亡外来者的胜负条件与自己相同，即使自己已死亡。')],
  '058':[kill(),roleCount('记录说书人获得的爪牙能力',['minion'],'说书人决定自己拥有以下爪牙能力并尽可能帮助恶魔：{roles}。')],
  '039':[kill(),many('审判日前处决后产生两名海德拉',2,'审判日降临前死于处决，善良玩家{target1}和邪恶玩家{target2}变成海德拉。',{targetLabels:['变成海德拉的善良玩家','变成海德拉的邪恶玩家']})],
  '106':[one('选择存活玩家击杀','选择存活的{targets}死亡。'),direct('全部邪恶死于处决触发获胜','审判日降临前，所有邪恶玩家均死于处决，所属阵营获胜。')],
  '108':[many('选择邻座两人分别投毒击杀',2,'选择互相邻座的{target1}中毒直到再次选择，{target2}死亡。',{targetLabels:['中毒目标','死亡目标'],targetLabel:'互相邻座的一对玩家'})],
  '114':[choose('击杀并决定是否告知色孽身份',1,['告知其自己是色孽','不告知自己是色孽'],'选择{targets}死亡，并{choice}。'),one('记录最近知晓身份的玩家','最近得知自己是色孽的{targets}与自己共享胜负条件，即使自己已死亡。')],
  '047':[kill(),one('上交投票标记的镇民共同获胜','以通常条件获胜，曾上交投票标记的镇民{targets}也获胜。')],
  '078':[kill(),one('黄昏与顺时针最近邪恶交换角色','黄昏时，与顺时针方向上最近的存活邪恶玩家{targets}交换角色。')],
  '031':[choose('决定是否同意死亡名单',0,['同意名单，按名单发生死亡','不同意名单，当晚只有自己死亡'],'得知当晚死亡名单（{targets}）后选择{choice}。',{maxTargets:30,targetLabel:'当晚将要死亡的玩家名单（可为空）'})]
 });

 Object.assign(forms,{
  // 群星
  yuxinshi_juanbing:[roleOnly('首夜得知最远的邪恶角色',evil,'首夜得知距离自己最远的邪恶角色为{role}。')],
  waijiaoguan_yanyumengxi:[one('保护与目标阵营不同的玩家','选择{targets}；与其阵营不同的玩家不会死亡直到下个黄昏。'),skip()],
  linghangyuan_heixing:[textAction('得知有邪恶的罗盘方位',0,'以上次处决指针为参照，得知某个方位有邪恶。','得知的方位（必填）',{hint:'以上次处决指针为南；若该玩家邪恶，则视为北。'})],
  beidaozhe_coambar:[withRole('邻近玩家死亡后得知另一邻居角色',1,any,'邻近的存活玩家死亡后，得知另一名邻近存活玩家{targets}的角色为{role}。',{excludeSelf:true})],
  shuizhanshi_zhiyanzhongbiaojiang:[one('设置醉酒的镇民','镇民{targets}因水占师而醉酒。'),one('醉酒镇民能力异常时得知邪恶玩家','醉酒镇民的能力在上个黎明至被唤醒前未正常生效，得知{targets}是邪恶玩家。'),one('未触发异常时得知善良玩家','未触发醉酒镇民能力异常条件，得知{targets}是善良玩家。')],
  shouyaoren_tixianzhengke:[one('使一名恶魔醉酒','恶魔{targets}因守钥人而醉酒。'),one('首个被恶魔选择者死亡','当晚首个被恶魔选择的{targets}因守钥人能力死亡。')],
  hezhongmao_kaka:[choose('记录说书人决定的类型',0,['镇民','外来者','爪牙','旅行者'],'说书人决定自己的角色类型为{choice}。'),roleOnly('将死时变成同类型角色并保留能力',nonDemon,'将要死亡时变成不在场的同类型{role}，并在死亡后保留能力。')],
  luxiangxuejia_zhangshunfeng:['镇民','外来者','爪牙','恶魔','旅行者'].map(type=>choose('选择'+type+'类型并查验玩家',1,['角色类型相同','角色类型不同'],'选择'+type+'类型和{targets}，被善良玩家当作相应类型与阵营，得知自己与目标{choice}。',{excludeSelf:true,hint:'所选类型必须与前两个夜晚不同。'})),
  anubisi_xiaolong:[many('选择两名玩家比较列表顺序',2,'选择{targets}，其中在角色列表靠上的玩家死亡。'),skip()],
  zhanzhengjisi_xiaoxic2h43g:[range('依次选择直到最后两人类型相同',2,29,'依次选择存活的{targets}，直到最后两次选择的玩家角色类型相同而停止。',{excludeSelf:true,hint:'按实际顺序勾选；每次必须选择除自己以外、此前未选择过的存活玩家。'}),skip()],
  kaoguxuejia_tiexuecuicuisha:[textAction('发现线索并获得奖励',0,'在房间内发现说书人留下的线索并获得奖励。','发现的线索与奖励（必填）')],
  mimaxuejia_axi:[textAction('首夜得知相关线索',0,'首夜得知与邪恶方共同关键词相关的线索。','得知的线索（必填）'),textAction('记录邪恶方共同关键词',0,'爪牙与恶魔互不认识，首夜得知同一个关键词。','邪恶方得知的关键词（必填）')],
  diantiguanliyuan_zz:[{...one('邀请玩家秘密选择列表行','邀请此前未邀请的其他存活玩家{targets}，由其秘密选择剧本第 {number} 行。',true),numberLabel:'秘密选择的行数',min:1,max:999},number('当晚得知该行在场角色数量',30,'当晚得知受邀玩家选择的行中有 {number} 个角色在场。')],
  geduo_tixianzhengke:[textAction('拜访说书人获取获胜方法线索',0,'拜访说书人，获得关于加入获胜阵营方法的线索。','得知的线索（必填）'),textAction('达成隐藏方法加入获胜阵营',0,'游戏结束时达成隐藏方法，加入获胜阵营。','达成的方法与获胜阵营（必填）')],
  shengkongdeng_shanxueyuzhu:[direct('安静时因能力死亡','安静时，因声控灯能力死亡。'),direct('说话时因能力复活','说话时，因声控灯能力复活。')],
  chuanyuezhe_jichen:[roleOnly('得知剧本外角色能力',any,'得知自己拥有剧本外{role}的能力。'),textAction('执行剧本外角色能力',0,'执行穿越者拥有的剧本外角色能力。','使用的能力与本次行动（必填）'),one('被存活爪牙公开猜中','存活爪牙{targets}公开猜中自己是穿越者，所属阵营落败。')],
  dipinglunzhe_heixing:[many('设置圆桌裂隙',2,'圆桌在相邻的{targets}之间裂开，恶魔得知裂隙所在。'),many('恶魔重新选择裂隙',2,'恶魔将圆桌裂隙重新选择在相邻的{targets}之间。')],
  beiguanzhuyizhe_zyz:[roleOnly('得知死亡后公开声称恶魔',['demon'],'得知自己死亡后公开声称{role}；若该角色不在场，恶魔获得其能力一天一夜。')],
  emu_chiyu:[withRole('上个死亡邪恶玩家保留能力并变角色',1,any,'上个死亡的邪恶玩家{targets}保留能力并变成不在场的同类型{role}，自己“是该角色”。',{hint:'最后一天不能发动；不强制邪恶玩家的角色类型必须是爪牙或恶魔。'})],
  lajiao_kaka:[{...number('首夜查看魔典并选择列表一列',30,'首夜查看魔典，选择列表第 {number} 列；该列所有非爪牙角色中毒且必定产生错误信息。'),min:1,numberLabel:'选择的列数'}],
  shandongzhe_dongyu:[choose('记录存活或死亡时的信息翻转',0,['存活状态','死亡状态'],'在自己的{choice}下，镇民产生信息的正误被翻转。')],
  guanzhongtaier_Naglfar:[{...slots('秘密挑选两个其他爪牙能力',[['minion'],['minion']],'无人代选时，秘密挑选{roles}的能力，拥有至下个黄昏。'),excludeOwnRole:true},{...one('被处决玩家公开挑选能力','被处决的{targets}公开挑选{roles}的能力，自己拥有至下个黄昏。'),roleSlots:[{label:'第一项其他爪牙能力',teams:['minion']},{label:'第二项其他爪牙能力',teams:['minion']}],excludeOwnRole:true}],
  dingxuwangzi_jichen:[{...number('首夜决定行动序数X',30,'首夜决定 X = {number}；每夜第 X 个因自身能力被唤醒的玩家当晚中毒。'),min:1,numberLabel:'选择的序数 X'},one('记录第X个被唤醒的中毒玩家','第 X 个因自身能力被唤醒的{targets}当晚中毒。')],
  shenzhangzhifu_baibianxjun:[textAction('记录恶魔对应的增强相克',0,'与{role}具有本局对应的增强相克规则。','相克规则与增强效果（必填）',{roleTeams:['demon'],roleLabel:'对应的恶魔角色'})],
  zhongli_tixianzhengke:[many('选择两名夜间击杀玩家',2,'选择{targets}作为夜间击杀目标。'),one('记录失去能力的爪牙','爪牙{targets}因重力的设置失去能力。'),one('不在场时其他恶魔变成重力','重力不在场，恶魔{targets}阻止当晚全部死亡并变成重力。')],
  jielv_xiaoxic2h43g:[kill(),choose('某类型首次无存活者触发中毒',0,['镇民','外来者','爪牙','恶魔'],'{choice}类型首次没有存活玩家，所有镇民中毒直到明天黄昏。')],
  shengcai_shenqierxuesonger:[kill(),textAction('记录镇民信息正误交替',1,'镇民{targets}本次信息与其上一次信息正误不同。','该次信息及其正误（必填）')],
  shenyuan_jichen:[kill(),roleOnly('邻座死亡后获得不在场爪牙能力',['minion'],'一名邻座玩家死亡，获得不在场{role}的能力。')],
  meiying_suziye:[kill(),one('处决死亡邪恶保留能力','死于处决的邪恶玩家{targets}保留能力。'),one('死亡玩家被再次处决导致阵营落败','已死亡的{targets}被处决，其所属阵营落败。'),direct('死亡玩家被处决前邪恶不会落败','在有死亡玩家被处决之前，邪恶阵营不会落败。')],
  yong_meiyouzanzhu:[roleOnly('选择不在场角色进行变化',any,'选择{role}；若该角色不在场，则变成该角色。'),one('类型改变导致同类型玩家死亡','因角色类型改变，相同新角色类型的玩家{targets}死亡。')],
  maomaojuntuan_meiyouzanzhu:[choose('得知同伴邻近是否有邪恶',0,['有邪恶玩家','没有邪恶玩家'],'得知顺时针最近的猫猫军团同伴邻近的两名存活玩家中{choice}。')],
  fengyi_meiyouzanzhu:[choose('得知顺时针下一位置的阵营',0,alignment,'从恶魔的顺时针方向依次推进，得知本夜对应玩家为{choice}。',{hint:'首夜从恶魔顺时针第一名玩家开始，此后每夜推进一名；不要求额外得知该玩家是谁。'})],
  // 海外自制：明确区分角色的原译与游戏性修改，未提供的规则不作推断。
  'f1431400-3621-4729-84b4-baaece0ac86e':[choose('首夜得知镇民距离奇偶多数',0,['奇数居多','偶数居多'],'首夜得知顺时针方向镇民与自己的距离{choice}；若相等，则由说书人决定信息。')],
  blacksmith:[number('首夜得知外来者人数',30,'首夜得知有 {number} 名外来者在场。'),direct('所有外来者醉酒','所有外来者因铁匠而醉酒。')],
  _pirate:[number('首夜得知海盗人数',30,'首夜得知有 {number} 名海盗在场。'),direct('所有存活善良角色都是海盗','所有存活善良角色均为海盗，善良阵营获胜。')],
  yuque_194993459:[roleCount('首夜得知在场邪恶角色',evil,'首夜得知在场的邪恶角色为{roles}。'),direct('首夜得知没有邪恶角色在场','首夜得知没有邪恶角色在场。')],
  yuque_194994783:[goodRole('选择获得善良角色能力','选择{role}，获得其能力直到下一次选择。'),direct('进入隔夜醉酒','依照天才每隔一晚的周期，醉酒一天。'),skip()],
  yuque_194997552:[number('得知当晚邪恶所选存活者的最近距离',30,'得知当晚被邪恶能力选择的存活玩家与自己的最近距离为 {number}。')],
  yuque_194998180:[choose('选择玩家并转变为其阵营',1,alignment,'选择其他存活玩家{targets}，转变为其阵营：{choice}。',{excludeSelf:true})],
  yuque_195006132:[textAction('选择玩家并得知英文名字母',1,'选择{targets}，得知其角色英文名中的一个字母。','得知的字母（必填）',{excludeSelf:true,excludeTravellers:true})],
  yuque_194996378:[one('得知玩家并使其醉酒错误信息','得知{targets}；其醉酒至下个黄昏，因自身能力获得的信息均为错误。')],
  yuque_194997234:[roleOnly('每夜得知在场角色',any,'得知在场角色{role}。')],
  yuque_194997367:[choose('选择玩家并得知阵营',1,alignment,'选择{targets}，得知其为{choice}；若目标不是自己且次日白天未被处决，则当晚转邪恶。'),one('目标未被处决转邪恶','目标{targets}未在次日白天被处决，在当晚转变为邪恶。',true),direct('自己不会转变为邪恶','因猎巫人能力不会转变为邪恶阵营。'),skip()],
  hunter:[one('选择符合邻座条件的玩家','选择{targets}；若其邻近玩家中恰好一名邪恶，且其不是恶魔，则其死亡。'),skip()],
  yuque_194991406:[roleCount('得知今天提名自己的角色',any,'得知今天提名自己的角色为{roles}；疯狂证明自己是投机者时，信息错误。')],
  yuque_194995528:[roleOnly('得知当晚死亡的一个角色',any,'得知当晚死亡的一个角色为{role}。')],
  yuque_194998337:[one('与玩家握手使其醉酒','与{targets}握手，该玩家可能醉酒直到明天黄昏。'),choose('得知白天是否与邪恶握手',0,['曾与邪恶玩家握手','未与邪恶玩家握手'],'得知今天白天{choice}。')],
  yuque_194997610:[one('选择死亡后公开身份的目标','选择{targets}；若其今晚死亡，所有玩家得知自己是窥私者。',true),direct('目标死亡公开身份','所选目标当晚死亡，所有玩家得知自己是窥私者。')],
  yuque_194993849:[textAction('拜访说书人得知信息',0,'白天向说书人得知一条信息；通常错误，每局游戏限一次正确。','得知的信息（必填）')],
  yuque_194998403:[textAction('选择话题并得知相关事实',0,'向说书人选择一个话题并获取相关事实；邻近存活玩家阵营不同时，信息错误。','选择的话题与得知的信息（必填）')],
  yuque_194998841:[textAction('记录自己的疯狂要求',0,'当天需要疯狂证明指定事项，否则自己可能死亡。','要求疯狂证明的事项（必填）'),textAction('记录邪恶玩家的疯狂要求',1,'邪恶玩家{targets}当天需要疯狂证明指定事项，否则可能死亡。','要求疯狂证明的事项（必填）'),range('未疯狂导致玩家死亡',1,2,'未满足疯狂要求，{targets}死亡。')],
  yuque_194992662:[textAction('公开改变规则',0,'征得说书人同意后，公开改变一条游戏规则。','本次改变的规则（必填）')],
  safeguard:[{...roleOnly('保护除自己外的角色',any,'选择{role}，邪恶玩家的负面能力对其无效。'),excludeOwnRole:true},skip()],
  yuque_194998370:[direct('公开发动转善良能力','公开发动能力，爪牙可秘密选择转善良，但下一个被处决玩家的阵营落败。'),choose('记录爪牙的秘密决定',1,['转变为善良','保持原阵营'],'爪牙{targets}秘密选择{choice}。'),one('下个处决者阵营落败','能力发动后，下个被处决的{targets}所属阵营落败。')],
  yuque_194999096:[roleOnly('首个白天获得剧本外能力',any,'首个白天拜访说书人，获得剧本外{role}的能力，即使自己醉酒或中毒。')],
  yuque_194994054:[range('邻近存活非旅行者醉酒',1,2,'与自己邻近的存活非旅行者{targets}醉酒。',{excludeSelf:true,excludeTravellers:true})],
  yuque_194996433:[textAction('与玩家缔结约定',1,'与其他玩家{targets}缔结约定，取代之前的约定。','约定内容（必填）',{excludeSelf:true}),choose('违反约定后记录死亡者',1,['自己死亡','违约者死亡'],'{targets}违反当前约定，结果为{choice}。')],
  yuque_194993985:[textAction('决定邮寄的信息',0,'决定最后一夜要让目标得知的信息。','决定的信息内容（必填）'),textAction('最后一夜选择收信玩家',1,'最后一夜选择{targets}，使其得知事先决定的信息，即使自己已死亡。','对方得知的信息（必填）')],
  yuque_194996844:[direct('同时被当作爪牙与邪恶','也是爪牙，且被当作邪恶阵营。'),one('被恶魔猜中内奸身份','恶魔{targets}公开猜中自己是内奸，所属阵营落败，即使已失去能力。')],
  yuque_194993756:[direct('首夜后保护其他善良玩家的信息与状态','除首个夜晚外，其他善良玩家不会醉酒、中毒或得知错误信息。')],
  yuque_194998069:[roleOnly('夜间死亡后在最后白天复活',['townsfolk'],'夜晚死亡后，在最后一个白天以不在场的{role}复活。')],
  yuque_194996483:[many('邻近两善良玩家得知女王身份',2,'邻近的{targets}均为善良，得知自己是女王。',{excludeSelf:true}),one('处决疯狂证明女王在场者','疯狂证明女王在场的{targets}被处决。')],
  yuque_194990970:[one('疯狂程度最高导致选择者死亡','白天最疯狂证明自己是大力士，当晚选择过自己的{targets}之一死亡。')],
  yuque_194996775:[choose('首夜得知最近非镇民类型',0,['外来者','爪牙','恶魔'],'首夜得知最近的非镇民玩家（旅行者除外）类型为{choice}。')],
  yuque_194994342:[textAction('存活时选择打破规则',0,'存活时选择打破游戏规则。','打破的规则及行为（必填）'),textAction('被说书人发现后的坏事',0,'打破规则被说书人发现，发生坏事，即使自己已经失去能力。','发生的坏事（必填）')],
  yuque_199017439:[one('选择玩家死亡','选择{targets}死亡；若杀死的不是爪牙，则与其交换角色和阵营。'),withRole('记录非爪牙死者的角色与交换',1,['townsfolk','outsider','demon','traveller'],'被杀死的{targets}是{role}，与其交换角色和阵营。'),skip()],
  yuque_200002972:[textAction('得知一名玩家做错的事',1,'白天拜访说书人，得知{targets}做错的事。','得知的事项（必填）')],
  yuque_199017430:[{...number('得知提名关联者的角色类型数',5,'得知提名过自己及被自己提名的玩家共有 {number} 种角色类型。')},one('累计三种类型后使关联者醉酒','累计达到三种角色类型后，提名关联玩家{targets}之一醉酒。')],
  yuque_194998913:[range('保护当晚遮眼的其他玩家',0,29,'除自己以外，当晚遮住眼睛的{targets}不会死亡；若自己死亡，他们可能死亡。',{excludeSelf:true,emptySentence:'当晚没有其他玩家通过遮住眼睛获得保护。'}),range('自己死亡导致遮眼者死亡',1,29,'自己死亡，原本遮住眼睛的{targets}因能力死亡。',{excludeSelf:true})],
  _prospector:[choose('得知提名目标最近邪恶的方向',1,['顺时针','逆时针'],'得知今天被自己提名的{targets}最近的邪恶玩家位于其{choice}方向；距离相等时由说书人决定。')],
  yuque_194996557:[choose('记录转邪恶前的保留善良决定',1,['保持善良','转变为邪恶'],'即将转邪恶但保留原角色的{targets}得知女教师在场，决定{choice}。')],
  yuque_194994873:[textAction('邻座全死后发生好事',0,'邻座玩家均已死亡，发生好事。','发生的好事（必填）')],
  yuque_194996332:[number('首夜得知设置调整角色数量',30,'首夜得知在场角色中有 {number} 名拥有设置调整能力。')],
  yuque_194994826:[range('得知当晚受到攻击的玩家',0,30,'得知当晚受到恶魔攻击的玩家为{targets}；攻击在生效前一晚发动。',{emptySentence:'得知当晚没有玩家受到恶魔攻击。'}),one('结算上一夜提前发动的攻击','上一夜提前发动的攻击对{targets}生效。')],
  yuque_194993350:[one('邻近善良处决死亡后保护全场','邻近的存活善良玩家{targets}死于处决，当晚恶魔负面能力对除自己外的玩家无效。')],
  yuque_194998318:[one('白天公开选择玩家','白天公开选择{targets}；若两人之一当晚被恶魔杀死，存活爪牙代替死亡。'),one('记录代替死亡的爪牙','一名存活爪牙{targets}代替被恶魔攻击的自己或所选玩家死亡。')],
  yuque_194998735:[roleCount('被唤醒时获得在场角色能力',any,'本局唯一一次被唤醒，按之前未被唤醒的夜晚数，获得{roles}的能力。'),direct('首次唤醒前没有累积能力','首次被唤醒时，此前未经历未唤醒的夜晚，未累积额外能力。')],
  yuque_199017906:[one('杀死自己的恶魔暗中转善良','恶魔{targets}杀死自己，其转变为善良但不知道。')],
  yuque_194994636:[range('首夜得知爪牙玩家',0,30,'首夜得知爪牙玩家为{targets}。',{emptySentence:'首夜得知没有爪牙玩家。'}),one('得知的爪牙被处决导致落败','首夜得知的爪牙{targets}被处决，所属阵营落败，即使自己已死亡。')],
  yuque_194997781:[choose('白天选择两人查验能力关联',2,['与正常发动的能力相关','不与正常发动的能力相关'],'白天私下选择{targets}，得知他们{choice}。')],
  yuque_194998023:[one('选择顺时针公开角色的起点','选择{targets}作为起点，沿顺时针要求公开自身角色。'),range('三秒内未公开角色的善良玩家死亡',1,30,'未在三秒内公开宣称自身角色的善良玩家{targets}死亡。')],
  yuque_194994495:[direct('首夜后未被提名获得保护','除首夜外，自己尚未被提名，不会死亡、转邪恶或改变角色。')],
  yuque_194994258:[{...number('首夜选择预言天数',99,'首夜选择第 {number} 天；若该天所有死亡玩家均为善良，自己死亡且他们以旅行者重新入场。'),min:1,numberLabel:'选择的天数'},range('预言触发后以旅行者重新入场',1,30,'所选天数的死亡玩家均为善良，自己死亡，{targets}以旅行者形式重新入场。')],
  yuque_199017444:[one('使杀死自己的恶魔中毒','恶魔{targets}杀死自己，因此中毒。')],
  yuque_199017433:[choose('邻近玩家公开决定是否转化',1,['同意，变成摩门教徒','不同意，两人均失去能力'],'邻近玩家{targets}公开{choice}。',{excludeSelf:true})],
  yuque_194993210:[one('设置被当作善良角色的邪恶玩家','邪恶玩家{targets}被当作善良阵营、镇民或外来者。'),choose('公开猜测被伪装的邪恶玩家',1,['猜对，所属阵营获胜','猜错，未因此获胜'],'公开猜测{targets}是被伪装的邪恶玩家，{choice}。')],
  yuque_194992504:[many('选择互换目标的两名存活玩家',2,'选择存活的{targets}；当晚能力选中其中一人时改为另一人，恶魔不会因此死亡。')],
  yuque_199017447:[direct('被提名使其他玩家醉酒','自己被提名，除旅行者以外的所有其他玩家醉酒直到黄昏。')],
  yuque_208120049:[number('首夜得知爪牙邻近的善良数量',30,'首夜得知与爪牙邻近的善良角色数量为 {number}。')],
  goldsmith_button:[{...roleCount('得知被邪恶能力影响的角色',any,'得知从上个黎明至被唤醒时，被邪恶能力选择或影响的其他角色：{roles}。'),excludeOwnRole:true},direct('得知没有其他角色被邪恶影响','得知从上个黎明至被唤醒时，没有其他角色被邪恶能力选择或影响。'),skip()],
  yuque_199958012:[textAction('邀请玩家问答后得知同答案问题',1,'邀请与之前不同的{targets}分别私下询问说书人，自己得知一个答案与其问题相同的是非问题。','对方的问题（如知晓）及自己得知的问题（必填）')],
  yuque_203549228:[number('得知白天投票的邪恶人数',30,'得知今天白天有 {number} 名邪恶玩家投过票；若无人投票，自己醉酒。')],
  yuque_195001052:[{...roleOnly('记录拥有的其他外来者能力',['outsider'],'拥有{role}的能力，另同时拥有其他所有外来者能力。'),excludeOwnRole:true},textAction('执行其他外来者能力',0,'执行隐修者拥有的外来者能力，其他外来者的设置调整不生效。','使用的能力与本次行动（必填）')],
  prisoner:[roleOnly('首夜得知释放后角色',any,'首夜得知不在场角色{role}；获多数同意释放后将变成该角色与对应阵营。'),roleOnly('超过半数同意后被释放',any,'超过半数玩家同意释放，变成{role}与对应阵营。'),direct('释放前不能投票','尚未被释放，不能投票。')],
  yuque_195001367:[choose('转变为首个处决死者的阵营',1,alignment,'在夜晚转变为首个死于处决的{targets}的阵营：{choice}。')],
  yuque_195001402:[direct('被提名当天自己和恶魔均未被处决','被提名当天，自己与恶魔均未被处决，所属阵营落败。')],
  yuque_195001598:[one('有人投票后立即被处决','针对自己的提名中，{targets}投票，自己被立即处决。')],
  yuque_199020281:[withRole('记录爪牙额外获得的能力',1,['minion'],'爪牙{targets}额外获得不在场{role}的能力，并得知此事，即使自己已死亡。'),{...one('提名后得知爪牙全部能力','提名{targets}后，当晚得知其全部能力：{roles}。'),roleSlots:[{label:'其原有爪牙能力',teams:['minion']},{label:'额外爪牙能力',teams:['minion']}]}],
  yuque_195001646:[one('选择连带处决玩家','选择其他存活玩家{targets}；明天两人之一被处决时，另一人也被处决。',true),one('触发连带处决','与自己关联的{targets}因花花公子能力也被处决。')],
  yuque_195002116:[direct('落败后下局仍为佃农','本局落败，下一局仍为佃农，即使自己已死亡。'),direct('不在盲抽袋时减少镇民','佃农不在盲抽袋中，设置减少一名镇民。')],
  yuque_203549175:[one('投票不同的后来者死亡','本次提名中，在自己之后且投票不同的{targets}死亡。')],
  yuque_199020284:[range('宣布自己死亡时未鼓掌者死亡',1,30,'说书人宣布自己死亡时，未鼓掌的{targets}因能力死亡。')],
  yuque_203953845:[one('死亡后恶魔查看魔典','自己死亡后，恶魔{targets}当晚查看魔典。')],
  yuque_195001797:[direct('善良且死亡后限制恶魔的死因','自己属于善良且已经死亡，恶魔只会因自己参与投票的处决而死亡。')],
  yuque_203952058:[one('首个提名者转邪恶','首个提名自己的{targets}当晚转变为邪恶。',true),direct('首次提名自己导致落败','自己是首个提名自己的玩家，所属阵营落败。')],
  yuque_199020277:[direct('本白天使用唯一一次投票','在本白天投票一次，此后本白天不能再投票。')],
  yuque_195002046:[one('死亡并声明公主后有人替死','死亡并声称公主后，{targets}选择代替死亡。',true),one('替死者邪恶导致阵营落败','选择替死的{targets}为邪恶，所属阵营落败。'),textAction('记录本局公主版本及替死情况',0,'按本局选用的公主规则处理声明与替死。','选用原译或修改版及本次情况（必填）',{hint:'原译与修改版的声明者和替死者条件不同；修改版要求善良死者声明、存活玩家替死。'}),many('其他死者声明公主后有人替死',2,'其他死者{target1}声称公主，{target2}选择代替死亡。',{targetLabels:['声称公主的其他死者','选择替代死亡的玩家'],hint:'按本局选用版本核对声明者与替死者条件。'})],
  yuque_199019895:[textAction('记录本局自定义能力行动',0,'记录猫夫人的本局约定与实际行动。','本局能力约定与实际行动（必填）',{maxTargets:30,hint:'本地角色资料为“正在维护”，未预设目标数量、效果或胜负规则。'})],
  yuque_199019927:[range('设置一至两名善良零票玩家',1,2,'善良玩家{targets}的投票标记被秘密记为零，即使自己已死亡。')],
  yuque_199020270:[textAction('记录本局自定义能力行动',0,'记录宝钻精灵的本局约定与实际行动。','本局能力约定与实际行动（必填）',{maxTargets:30,hint:'本地角色资料为“正在维护”，未预设目标数量、效果或胜负规则。'})],
  yuque_199811084:[textAction('善良玩家得知虚假信息',1,'善良玩家{targets}因乌鸦嘴而得知虚假信息，即使自己已死亡。','虚假信息内容（必填）')],
  yuque_203549178:[range('处决死亡后邻近者不计入邪恶胜利',1,2,'自己死于处决，邻近的存活玩家{targets}不计入邪恶阵营获胜条件。',{excludeSelf:true})],
  bullfighter:[one('自己提名后投票者夜间死亡','自己发起提名后，除自己外参与投票的{targets}当晚死亡。',true),direct('无人投票导致自己死亡','自己发起的提名中没有其他玩家投票，自己当晚死亡。')],
  yuque_195000819:[direct('选择成为说书人','选择成为说书人，即使自己已死亡；此后仍可投票。')],
  charoit:[{...one('记录当前距离的中毒玩家','顺时针距离自己 {number} 的{targets}中毒。'),numberLabel:'当前顺时针距离',min:1,max:30},one('遇邪恶非旅行者交换角色','当前距离的{targets}为邪恶非旅行者，与其交换角色。'),direct('推进顺时针距离','每个首夜后的夜晚，或当前玩家已死亡，顺时针距离加一。')],
  yuque_199810980:[textAction('使至多三人以为受到疯狂影响',0,'选择{targets}，使其以为受到疯狂能力影响，但实际上没有。','告知目标的疯狂要求（必填）',{maxTargets:3,emptySentence:'没有选择任何玩家施加虚假的疯狂要求。'})],
  yuque_195000292:[one('与恶魔共同选择夜间击杀','与恶魔一起被唤醒，选择{targets}死亡。'),one('自己死亡使恶魔失能','自己死亡，恶魔{targets}失去能力。')],
  yuque_199964816:[number('记录猜中自己的善良玩家数量',30,'除旅行者外至多五人存活且邪恶本应落败时，同时猜谜，{number} 名善良玩家猜中自己。'),direct('少于两名善良猜中改判邪恶获胜','符合触发条件且少于两名善良玩家猜中自己，邪恶阵营获胜，即使自己已死亡。')],
  yuque_199810919:[roleOnly('白天首次疯狂证明在场角色',any,'白天首次疯狂证明自己是在场的{role}，当天令其中毒并获得其能力。')],
  yuque_194990941:[textAction('邻近非旅行者被错误识别',1,'邻近的非旅行者{targets}被善良能力当作错误的阵营和角色。','被识别成的阵营与角色（必填）',{excludeSelf:true,excludeTravellers:true})],
  yuque_200003954:[one('提名阶段开始公开选择玩家','提名阶段开始时公开选择存活非旅行者{targets}；若自己是本阵营唯一选择者，且其今天未被处决，则其阵营获胜。'),one('所选者未被处决触发阵营胜利','满足唯一公开选择条件，所选的{targets}今天未被处决，其阵营获胜。')],
  yuque_199031253:[many('选择两人反转识别阵营',2,'选择{targets}，其中非恶魔玩家被当作与原本相反的阵营直到下个黄昏。')],
  yuque_199031325:[one('选择死亡目标','选择{targets}死亡，在此之前另一名同阵营玩家复活。'),many('记录先复活再死亡的玩家',2,'先令同阵营的{target1}复活，再令{target2}死亡。',{targetLabels:['先复活的玩家','随后死亡的玩家']}),direct('恶魔死亡不结束游戏','恶魔死亡不会导致游戏结束。'),skip()],
  yuque_194999938:[roleOnly('首夜选择所有外来者的角色',['outsider'],'首夜选择{role}，所有外来者均为该角色。')],
  yuque_208110868:[withRole('得知失能善良玩家及其角色',1,any,'得知善良玩家{targets}的角色为{role}；其失去能力且以为自己是爪牙。')],
  yuque_195000973:[direct('被善良能力当作恶魔','被善良玩家的能力当作恶魔。'),one('恶魔被善良能力当作爪牙','恶魔{targets}被善良玩家的能力当作爪牙。')],
  yuque_199031365:[one('提名玩家触发邻座投毒','提名{targets}，其本人与邻座玩家中的善良玩家中毒直到下一次提名。'),range('记录当前因提名中毒的善良玩家',1,3,'当前被提名者及其邻座中的善良玩家{targets}中毒。')],
  yuque_195001014:[choose('选择自己是否醉酒',0,['醉酒直到下个黄昏','不醉酒'],'选择自己{choice}。'),direct('限制只能提名邻近存活者','玩家只能提名各自邻近的存活玩家。')],
  yuque_199031343:[direct('无善良存活者被其他人提名触发获胜','白天没有存活善良玩家被其他玩家提名，邪恶阵营获胜。'),withRole('被提名后恶魔被当作善良角色',1,good,'自己被提名后，当晚恶魔{targets}被当作善良的{role}。')],
  yuque_194999737:[roleOnly('获得在场爪牙能力',['minion'],'拥有在场{role}的能力。'),roleOnly('无其他爪牙时首夜选择能力',['minion'],'没有其他爪牙在场，首夜选择获得{role}的能力。')],
  yuque_199031376:[many('邪恶提名邪恶后交换角色',2,'邪恶的{target1}提名存活邪恶玩家{target2}，两人交换角色。',{targetLabels:['邪恶提名者','存活的邪恶被提名者']}),one('善良公开驱散导致中毒','善良玩家{targets}公开声称驱散浊瘴，自己与镇民玩家中毒。')],
  yuque_195000144:[direct('翻转善良玩家的信息正误','善良玩家的信息正误翻转。'),one('善良首次说出角色名导致失能','善良玩家{targets}首次说出“诺克斯之女”，自己失去能力。'),one('邪恶首次说出角色名后重获能力','邪恶玩家{targets}首次说出“诺克斯之女”，自己重新获得能力。')],
  yuque_195000061:[one('选择离座即死的玩家','选择{targets}；若其下个白天离开座位，则死亡。'),one('所选玩家离座死亡','所选玩家{targets}在下个白天离开座位，因此死亡。'),direct('三人以下失去能力','存活人数少于或等于三人，失去能力。')],
  yuque_208113222:[withRole('得知死亡外来者并猜测角色',1,['outsider'],'得知当天死亡的外来者{targets}，猜测其为{role}。'),one('猜中后玩家死亡','猜中死亡外来者的角色，使{targets}死亡。')],
  yuque_199031046:[kill(),one('额外选择被邪恶提名过的玩家','选择上个白天被邪恶玩家提名过的{targets}，使其额外死亡。'),direct('不进行额外击杀','完成常规击杀后，没有选择额外击杀目标。')],
  yuque_195002601:[range('选择共同得知标记的玩家',0,30,'选择{targets}，使其一同被唤醒得知此事；明天他们之一被处决时所有目标立即死亡。',{emptySentence:'当晚未选择标记玩家。'}),range('标记者之一被处决导致全体死亡',1,30,'标记者之一被处决，所有被选择的{targets}立即死亡。'),direct('无存活玩家被处决触发邪恶胜利','白天没有存活玩家被处决，邪恶阵营获胜。')],
  yuque_195003887:[one('选择转邪恶目标','选择{targets}，其转变为邪恶；每局游戏有一次选择失效。'),one('记录唯一一次选择失效','本局唯一一次失效，所选的{targets}未因该次选择转变阵营。'),direct('第五个白天结束获胜','第五个白天结束，邪恶阵营获胜。')],
  sissaphyth:[kill(),{...roleOnly('爪牙全死后变成其他恶魔',['demon'],'所有爪牙死亡，变成{role}，此后每晚行动两次。'),excludeOwnRole:true}],
  yuque_200004043:[choose('选择击杀并转变为目标阵营',1,alignment,'选择{targets}死亡，自己转变为其阵营：{choice}。'),direct('自己死亡导致阵营落败','自己死亡，所属阵营落败。'),direct('两人存活时所属阵营获胜','只有两名玩家存活，所属阵营获胜。')],
  lecadeau:[kill(),one('首个提名自己的镇民接替献礼','首个提名自己的镇民{targets}当晚变成邪恶的献礼，自己死亡；每局限成功一次。')],
  yuque_200003347:[kill(),one('被镇民提名导致自己死亡','镇民{targets}提名自己，自己死亡。'),many('两名善良同日提名触发获胜',2,'善良的{targets}在同一天发起提名，邪恶阵营获胜。')],
  yuque_195002553:[direct('首夜查看魔典','首夜查看魔典。'),range('列表最顶部一行的存活者死亡',1,30,'存活玩家中位于列表最顶部一行的{targets}当晚死亡。')],
  yuque_199810744:[kill(),many('善良玩家得知恶魔在两人之中',3,'善良玩家{target1}得知自己在{target2}和{target3}之中。',{allowRepeatedTargets:true,distinctTargetGroups:[[1,2]],targetLabels:['得知信息的善良玩家','第一名候选恶魔','第二名候选恶魔']}),direct('有存活爪牙时被处决获胜','有爪牙存活时自己被处决，所属阵营获胜。')],
  yuque_195003132:[one('记录夜间死亡玩家','当晚{targets}因提普-提普能力死亡。'),one('最后一晚选择疯狂否认恶魔的玩家','最后一晚选择{targets}疯狂证明自己不是恶魔，否则其阵营落败。'),one('未疯狂导致所属阵营落败','最后一晚选中的{targets}未满足疯狂要求，其所属阵营落败。')],
  yuque_199965616:[{...kill(),hint:'夜晚行动顺序位于最末尾。'}],
  yuque_199031072:[kill(),one('得知白天提及自己的玩家','常规击杀后，得知昨天白天提及过自己的{targets}。'),choose('决定是否杀死被告知者',1,['让其死亡','不让其死亡'],'对得知的{targets}选择{choice}。')],
  yuque_199031091:[one('选择夜间击杀玩家（即使已死）','选择{targets}死亡，即使自己已经死亡。'),one('死亡爪牙变成九头蛇','死亡爪牙{targets}选择变成九头蛇，每局游戏仅能成功转化一次。')],
  yuque_195002575:[many('首夜感染三名其他玩家',3,'首夜感染除自己外的{targets}。',{excludeSelf:true}),one('夜间选择感染玩家','选择{targets}受到感染。'),many('感染者提名死亡并传播',2,'被感染的{target1}发起提名后死亡，并感染被提名的{target2}。',{allowRepeatedTargets:true,targetLabels:['发起提名的感染者','被提名而受感染的玩家']}),direct('第四个白天结束获胜','第四个白天结束，邪恶阵营获胜。')],
  yuque_195002921:[range('黄昏后善良举手导致死亡',1,30,'黄昏后有存活善良玩家举手，相应的{targets}当晚死亡。'),direct('无人举手导致邪恶获胜','黄昏后没有任何存活善良玩家举手，邪恶阵营获胜。'),range('记录黄昏后举手的存活善良玩家',1,30,'黄昏后，存活的善良玩家{targets}举手，每人对应一名玩家死亡。')],
  yuque_199031065:[direct('初始设置所有玩家死亡','初始设置所有玩家死亡。'),one('每夜选择玩家复活','选择{targets}复活。'),one('被处决的死亡玩家复活','死亡的{targets}被处决后复活。'),direct('原译：所有邪恶存活触发获胜','按原译规则，所有邪恶玩家存活，邪恶阵营获胜。'),direct('修改版：所有善良曾复活触发获胜','按游戏性修改规则，所有善良玩家都被复活过，邪恶阵营获胜。'),direct('修改版：反转提名投票规则并保留能力','按游戏性修改规则，提名投票规则反转，自己不会失去能力。')],
  yuque_195003041:[range('标记至多三名玩家',0,3,'标记{targets}，并使其得知自己被标记。',{emptySentence:'当晚没有新增标记玩家。'}),range('令所有已标记者死亡',1,30,'选择让所有已被标记的{targets}死亡。')],
  yuque_195003482:[many('选择三名被欺骗者',3,'选择欺骗{targets}，所有玩家得知这些目标。'),many('原译：被欺骗者选择其他存活玩家',2,'按原译规则，被欺骗的{target1}选择其他存活玩家{target2}。',{targetLabels:['被欺骗的玩家','其选择的其他存活玩家'],hint:'原译中三名被欺骗者须选择不同的存活玩家；每人的选择分别记录。'}),many('修改版：被欺骗者选择一名玩家',2,'按游戏性修改规则，被欺骗的{target1}选择{target2}。',{allowRepeatedTargets:true,targetLabels:['被欺骗的玩家','其选择的玩家']}),many('被选择者中两人死亡',2,'被欺骗者选择的目标中，{targets}死亡。'),skip()],
  yuque_203953955:[one('击杀并在白天被当作存活','选择{targets}死亡，其在白天被当作存活。')],
  yuque_195003422:[kill(),textAction('公开与目标比较的特征',0,'向所有玩家公开本局用于比较的特征。','公开的特征（必填）'),one('特征不同的死者转邪恶并失去投票', '被自己杀死且符合特征不同条件的{targets}转邪恶，并不再能在本局投票。')],
  yuque_195003160:[kill(),direct('原译：最后一夜后禁止死者交流','按原译规则，最后一夜结束后，死亡玩家不能与存活玩家交流。'),direct('修改版：可能下夜结束时禁止死者交流','按修改版规则，游戏可能在下个夜晚结束，死亡玩家不能与存活玩家交流。')],
  yuque_199031099:[kill(),textAction('记录累计投票',1,'记录{targets}本次及累计获得的票数。','本次票数与累计票数（必填）'),one('原译：累计票数达存活数被处决','按原译规则，{targets}累计票数达到存活玩家数，被处决。'),one('修改版：日末累计票数最高者被处决','按修改版规则，白天结束时，累计票数最高的{targets}被处决。')]
 });


 // Saved action IDs and labels remain stable; only their journal wording changes.
 Object.assign(forms.savant[0],{textSlots:['第一条信息','第二条信息'],textSentence:'得知了第一条信息：{text1}；第二条信息：{text2}。',legacySentence:'得知了：{detail}'});
 Object.assign(forms.gambler[0],{choices:['赌对了','赌错了'],choiceLabel:'本次猜测结果（可选）',optionalChoice:true});
 Object.assign(forms.amnesiac[0],{textSlots:['猜测内容','说书人回答'],textSentence:'猜测了：{text1}。说书人回答：{text2}。',legacySentence:'猜测并获得了反馈：{detail}'});
 Object.assign(forms.amnesiac[1],{textSlots:['本次能力行动或信息'],textSentence:'{text1}',legacySentence:'记录了能力行动：{detail}'});
 forms.amnesiac.push({...info('记录本局设定的能力','本局能力为：{detail}'),textSlots:['说书人为本局设定的能力'],textSentence:'能力是：{text1}',legacySentence:'能力是：{detail}'},number('记录能力得到的数字',999,'得知了：{number}。'),textAction('选择玩家并得知信息',1,'选择了{targets}，得知：{detail}','选择玩家后得知的信息（必填）',{textSlots:['得知的信息'],textSentence:'选择了{targets}，得知：{text1}',legacySentence:'选择了{targets}，得知：{detail}',hint:'用于本局自定义能力需要选择一名玩家的情况；记录实际获知的角色类型、数字或其他信息。'}));
 forms.cannibal.push({...withRole('用获得的能力记录数字',0,any,'得知了：{number}。'),numberLabel:'得知的数字',min:0,max:999,actorRoleTag:true,roleLabel:'本次使用或自认为获得的角色能力'},textAction('用获得的能力记录信息',0,'得知了：{detail}','得知的信息（必填）',{roleTeams:any,roleLabel:'本次使用或自认为获得的角色能力',actorRoleTag:true,textSlots:['得知的信息'],textSentence:'得知了：{text1}',legacySentence:'得知了：{detail}'}),withRole('以为自己获得了某角色能力',0,any,'以为自己获得了{role}的能力。'));
 Object.assign(forms.cannibal[4],{targets:0,roleTeams:undefined,roleSlots:[{label:'实际获得的角色能力',teams:any},{label:'以为获得的角色能力',teams:any}],allowRepeatedRoles:true,actorRoleTagSlot:0,sentence:'以为自己获得了{role2}的能力。'});
 forms.cannibal.push({...withRole('用获得的能力选择玩家',1,any,'选择了{targets}。'),maxTargets:30,actorRoleTag:true,roleLabel:'本次使用的角色能力',hint:'按实际使用的能力选择目标；击杀、死亡等结果需要另行记录。'}, {...direct('用获得的能力记录认知角色','以为自己是{role2}。'),roleSlots:[{label:'实际获得的角色能力',teams:any},{label:'以为自己是的角色',teams:any}],allowRepeatedRoles:true,actorRoleTagSlot:0,hint:'例如实际获得疯子能力，以为自己是方古。此项只记录认知身份。'});
 forms.drunk.push({...withRole('以为镇民身份得知数字',0,['townsfolk'],'得知了：{number}。'),numberLabel:'得知的数字',min:0,max:999,actorRoleTag:true,roleLabel:'本次以为自己拥有的镇民能力'},textAction('以为镇民身份得知信息',0,'得知了：{detail}','得知的信息（必填）',{roleTeams:['townsfolk'],roleLabel:'本次以为自己拥有的镇民能力',actorRoleTag:true,textSlots:['得知的信息'],textSentence:'得知了：{text1}',legacySentence:'得知了：{detail}'}));
 forms.princess=[{...one('首个白天提名并处决玩家','首个白天提名的{targets}被处决，当晚恶魔不造成死亡。'),targetLabel:'首个白天由自己提名并被处决的玩家',hint:'核对提名、处决与首个白天的条件后记录；不自动修改任何玩家的生死。'},direct('记录当晚恶魔不造成死亡','首个白天满足能力条件，当晚恶魔不造成死亡。')];
 Object.assign(forms.qintianjian[0],{choiceLabel:'说书人告知的方向',hint:'选择说书人实际告知的左侧、右侧或两侧相同；只记录收到的信息，不根据当前魔典推算或修正答案。'});
 Object.assign(forms.charoit[0],{targetLabel:'当前被战车控制的玩家',hint:'填写当前顺时针距离，再选择实际中毒的玩家。交换角色用独立行动记录，不把邪恶非旅行者当作中毒目标。'});
 Object.assign(forms.charoit[2],{sentence:'将顺时针距离加一。',hint:'核对本局能力描述中的推进条件，再记录本次距离增加；不自动推进距离或修改玩家角色。'});
 // Keep existing keys and free-text records; typed guesses do not expose actual evil identities.
 for(let count=1;count<=3;count++)forms.alsaahir.push(many('猜测 '+count+' 名爪牙和 1 名恶魔',count+1,'公开猜测爪牙是'+Array.from({length:count},(_,i)=>'{target'+(i+1)+'}').join('、')+'，恶魔是{target'+(count+1)+'}。',{targetLabel:'公开猜测的玩家',targetLabels:[...Array.from({length:count},(_,i)=>'猜测的爪牙 '+(i+1)),'猜测的恶魔'],hint:'按你公开提出的猜测选择玩家，最后一项是恶魔。填写猜测不会自动判断对错；其他人数可用自由文字记录。'}));
 for(const form of [forms.alsaahir[0],...forms.alsaahir.slice(2)])Object.assign(form,{choices:['猜测正确','猜测错误'],optionalChoice:true,choiceLabel:'本次猜测结果（可选）',hint:(form.hint||'')+' 可以先不判断；只有明确选择猜测正确，保存后才提供善良阵营获胜的确认补记。'});
 // Explicit outcome plans, never inferred from a label or a role's display name.
 // Optional prompts still require the Storyteller to confirm the actual resolution.
 const followup=(id,index,effect,extra={})=>{const form=forms[id][index];form.followups=[...(form.followups||[]),{effect,...extra}];};
 for(const [id,index]of [['imp',0],['vigormortis',0],['no_dashii',0],['vortox',0],['zombuul',0],['shabaloth',0],['po',1],['po',2],['assassin',0],['godfather',6],['witch',1],['psychopath',0],['gossip',1],['ojo',1],['ojo',2],['legion',0],['lil_monsta',1],['yaggababble',2],['al-hadikhia',2]])followup(id,index,'death');
 for(const [id,index]of [['poisoner',0],['widow',0],['pukka',0],['vigormortis',2],['no_dashii',1],['lleech',0]])followup(id,index,'poison');
 for(const [id,index]of [['sweetheart',0],['sailor',1],['innkeeper',1]])followup(id,index,'drunk');
 for(const [id,index]of [['professor',0],['shabaloth',1],['al-hadikhia',3]])followup(id,index,'revive');
 followup('pukka',1,'death');followup('pukka',1,'healthy');
 followup('sailor',0,'drunk',{subjects:'actorAndTargets',exclusive:true});followup('innkeeper',0,'drunk',{exclusive:true});
 for(const [id,index]of [['grandmother',1],['tinker',0],['gambler',1],['lleech',2],['fang_gu',1]])followup(id,index,'death',{subjects:'actor'});
 followup('cannibal',1,'poison',{subjects:'actor'});
 followup('slayer',0,'death',{choice:'死亡'});followup('gambler',0,'death',{subjects:'actor',choice:'赌错了'});followup('psychopath',1,'death',{subjects:'actor',choice:'自己输，死亡'});
 followup('snake_charmer',0,'poison',{choice:'交换角色与阵营，原恶魔中毒'});
 for(const [id,index]of [['mayor',0],['moonchild',1],['shaxing',0],['yangguren',0],['qiongqi',2],['taotie',1],['ranfangfangzhu',1],['dianyuzhang',1],['dianyuzhang',2],['yanluo',2],['harpy',1],['boomdandy',1]])followup(id,index,'death');
 for(const [id,index]of [['dagengren',2],['geling',1],['jinyiwei',1],['shutong',1],['acrobat',1]])followup(id,index,'death',{subjects:'actor'});
 followup('harlot',2,'death',{subjects:'actorAndTargets'});followup('shusheng',2,'death',{targetIndices:[1]});followup('riot',1,'death',{targetIndices:[0]});
 for(const [id,index]of [['gudiao',0],['charoit',0],['045',0],['057',0],['061',0],['111',0],['062',0],['062',1]])followup(id,index,'poison');
 for(const [id,index]of [['dianxiaoer',1],['diaomin',0],['jiubao',0],['daoshi',1],['puzzlemaster',0],['044',0],['076',0]])followup(id,index,'drunk');
 followup('dianxiaoer',0,'drunk',{exclusive:true});followup('sailor',2,'drunk',{subjects:'actor'});followup('villageidiot',1,'drunk',{subjects:'actor'});followup('daoshi',1,'death',{subjects:'actor'});followup('045',1,'healthy');
 followup('hundun',1,'goodPoison',{actorGroup:'good'});
 followup('hundun_all_good',1,'poison',{actorGroup:'good'});
 for(const index of [0,2,3,4])followup('alsaahir',index,'victory',{actorGroup:'good',choice:'猜测正确'});followup('alsaahir',1,'victory',{actorGroup:'good'});
 const journal={
  washerwoman:['得知了{targets}中存在一名{role}。','得知了{role}在场。'],
  librarian:['得知了{targets}中存在一名{role}。','得知了{role}在场。','得知没有外来者在场。'],
  investigator:['得知了{targets}中存在一名{role}。','得知了{role}在场。','得知没有爪牙在场。'],
  fortune_teller:['选择了{targets}，得知他们之中{choice}。'],
  dreamer:['选择了{targets}，得知他是{role1}或{role2}。'],
  monk:['选择了{targets}。'],poisoner:['选择了{targets}。'],widow:['查看了魔典，并选择了{targets}。','{targets}得知寡妇在场。'],
  gambler:['赌{targets}是{role}。','赌错后死亡了。'],
  godfather:['得知没有外来者在场。','得知{roles}在场。','得知{roles}在场。','得知{roles}在场。','得知{roles}在场。','得知{roles}在场。','由于白天有外来者死亡，选择了{targets}。'],
  grandmother:['得知自己的孙子{targets}是{role}。','因孙子{targets}被恶魔杀死而死亡了。'],
  lunatic:['以为自己是{role}。','选择了憋刀。','选择了{targets}。','选择了{targets}。','选择了{targets}。','自己的疯子身份被{targets}得知。'],
  seamstress:['选择了{targets}，得知他们{choice}。'],
  devils_advocate:['选择了{targets}。'],exorcist:['选择了{targets}。','选中了恶魔{targets}，他得知自己是驱魔人。'],
  cannibal:['获得了{role}的能力（来自{targets}）。','因上个处决死者属于邪恶阵营而中毒了。'],
  balloonist:['得知了：{targets}。','得知了：{targets}。'],
  shabaloth:['选择了{targets}。','反刍了{targets}，使其复活。'],
  po:['选择了憋刀。','选择了{targets}。','蓄力后选择了{targets}。'],
  imp:['选择了{targets}。','自刀并传位给{targets}。'],
  professor:['选择了死亡玩家{targets}。'],
  courtier:['选择了{role}。'],
  cerenovus:['选择了{targets}疯狂证明自己是{role}。'],
  'pit-hag':['选择了{targets}和{role}，{choice}。'],
  flowergirl:['得知今天白天{choice}。'],town_crier:['得知今天白天{choice}。']
 };
 function journalSentence(profile,spec,index){
  const custom=journal[profile.id]?.[index];if(custom)return custom;
  if(spec.numberLabel==='得知的数字'&&/^(?:得知|首夜得知|当晚得知|每夜得知|审判日得知)/.test(spec.label))return '得知了：{number}。';
  if(/^选择\{targets\}作为(?:当晚的|夜间)?击杀目标。$/.test(spec.sentence))return '选择了{targets}。';
  // Remove a rule-only conditional suffix only when every original value token
  // still appears in the action. Never guess outcomes or lose recorded inputs.
  const cut=spec.sentence.search(/[；，](?=若|如果)/),head=cut<0?'':spec.sentence.slice(0,cut),tokens=spec.sentence.match(/\{[^}]+\}/g)||[];
  const concise=head&&tokens.every(token=>head.includes(token))?head+'。':spec.sentence;
  return concise.replace(/^选择(?=\{)/,'选择了');
 }
 const normalize=v=>String(v||'').normalize('NFKC').replace(/[\s，。；：、,.!！?？:()（）]/g,'');
 // Verified complete wording from imported scripts. Never match by name/ID or strip rule-bearing words.
 // The older Chariot with different traveller and distance rules is intentionally separate.
 const abilityVersions={
  gambler:['每个夜晚*，你要选择一名玩家并猜测他的角色：如果你猜错了，你会死亡。'],
  gossip:['每个白天，你可以公开发表一个声明。在当晚，如果该声明是正确的，会有一名玩家死亡。'],
  qintianjian:['在你的首个夜晚，你会得知离你最近的邪恶玩家位于你的哪一侧（左/右/相同）。如果与你邻近的玩家中有邪恶阵营，你会得知错误信息。'],
  farmer:['如果你在夜晚死亡，一名存活的善良玩家会变成农夫。'],
  exorcist:['每个夜晚*，你要选择一名玩家（与上个夜晚不同）：如果你选中了恶魔，他会得知你的角色，但他当晚不会因其自身能力而被唤醒。'],
  preacher:['每个夜晚，你要选择一名玩家：如果选中了爪牙，他会得知被传教士选中。所有被你选中的爪牙失去能力。'],
  alsaahir:[
   '每个白天限一次，你可以公开猜测谁是爪牙，谁是恶魔。如果你猜对，善良阵营获胜。',
   "'每个白天，你可以公开进行一次谁是爪牙，谁是恶魔的猜测。如果你猜对，善良阵营获胜。"
  ],
  charoit:[
   '与你顺时针距离为1的玩家中毒。如果是邪恶的非旅行者玩家，改为和他交换角色。每个夜晚*，或该玩家死亡的，该距离+1。',
   '与你顺时针距离为1的玩家中毒。如果是邪恶的非旅行者玩家，改为和他交换角色。每个夜晚*，或该玩家死亡时，该距离+1。'
  ]
 };
 const reminderWarnings=new Set(['king','al-hadikhia','shaxing','limao','yishi','gudiao','baojun','jianning','003','030','014','105','060','071','108']);
 const byKey=new Map();for(const profile of profiles){profile.actions=forms[profile.id].map((spec,i)=>Object.freeze({...spec,recordSentence:journalSentence(profile,spec,i),nightReminder:[profile.firstNightReminder?'首夜：'+profile.firstNightReminder:'',profile.otherNightReminder?'其他夜晚：'+profile.otherNightReminder:''].filter(Boolean).join('\n')+(reminderWarnings.has(profile.id)?'\n注：本地夜晚提醒与当前能力描述存在差异，行动表单以当前能力描述为准。':''),key:(profile.script||'tb')+'/'+profile.id+'/'+i,action:profile.name+'：'+spec.label}));Object.freeze(profile.actions);for(const spec of profile.actions)byKey.set(spec.key,{profile,spec});Object.freeze(profile);}Object.freeze(profiles);
 const nameKey=v=>String(v||'').normalize('NFKC').replace(/\s+/g,''),idKey=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/_gstone$/,'').replace(/[-_\s]/g,'');
 const byAbility=new Map(),byName=new Map(),byId=new Map();
 function indexProfile(map,key,profile){if(!key)return;const found=map.get(key)||[];if(!found.includes(profile))found.push(profile);map.set(key,found);}
 for(const p of profiles){for(const wording of [p.ability,...(abilityVersions[p.id]||[])])indexProfile(byAbility,normalize(wording),p);indexProfile(byName,nameKey(p.name),p);indexProfile(byId,idKey(p.id),p);}
 function match(role){
  if(!role)return {reason:'missing'};
  const team=role.team==='traveler'?'traveller':role.team,eligible=p=>!team||team==='unknown'||p.team===team,name=nameKey(role.name),id=idKey(role.id);
  const choose=(candidates,matchedBy)=>{
   let found=candidates.filter(eligible);if(!found.length)return {reason:'unmatched'};
   if(found.length>1){const named=found.filter(p=>nameKey(p.name)===name);if(named.length)found=named;}
   if(found.length>1){const identified=found.filter(p=>idKey(p.id)===id);if(identified.length)found=identified;}
   return found.length===1?{profile:found[0],matchedBy}:{reason:'ambiguous'};
  };
  // Explicit ability text is authoritative. Name/ID may disambiguate its matches,
  // but cannot replace a conflicting definition. No edit-distance rule guessing.
  if(String(role.ability||'').trim())return choose(byAbility.get(normalize(role.ability))||[],'ability');
  const named=(byName.get(name)||[]).filter(eligible);if(named.length)return choose(named,'name');
  return choose(byId.get(id)||[],'id');
 }
 function profileForRole(role){return match(role).profile;}
 function iconRoleId(role){const profile=profileForRole(role);return profile?(profile.iconRoleId||profile.id):'';}
 function forRole(role){const actions=profileForRole(role)?.actions||[];return actions.some(s=>s.menuOrder!==undefined)?actions.slice().sort((a,b)=>(a.menuOrder||0)-(b.menuOrder||0)):actions;}
 function get(key){return byKey.get(key)?.spec;}
 function validate(entry){
  const data=entry.abilityAction,known=byKey.get(data?.key),spec=known?.spec,role=data?.role;
  if(!spec||!entry.actor||entry.actorGroup!==undefined||entry.action!==spec.action||entry.actor.roleId!==role?.id||entry.actor.roleName!==role?.name||entry.actor.team!==role?.team||!forRole(role).some(s=>s.key===spec.key))throw Error('角色能力行动与角色资料不匹配');
  if(entry.targets.some(p=>!p?.seatId)||entry.targets.length<spec.targets||entry.targets.length>(spec.maxTargets??spec.targets)||spec.excludeSelf&&entry.targets.some(p=>p.seatId===entry.actor.seatId))throw Error('请选择 '+spec.targets+(spec.maxTargets?' 至 '+spec.maxTargets:'')+' 名符合能力描述的玩家');
  if(spec.excludeSelfAt?.some(i=>entry.targets[i]?.seatId===entry.actor.seatId))throw Error('该位置不能选择自己');
  if(!spec.allowRepeatedTargets&&new Set(entry.targets.map(p=>p.seatId)).size!==entry.targets.length)throw Error('请选择不同的玩家');
  if(spec.roleTeams){if(!data.selectedRole||!spec.roleTeams.includes(data.selectedRole.team))throw Error('请选择符合能力描述的角色类型');}else if(data.selectedRole!==undefined)throw Error('这项能力不需要角色');
  const slots=roleSlots(spec,data.number);if(spec.roleSlots||spec.roleCount){if(!Array.isArray(data.selectedRoles)||data.selectedRoles.length!==slots.length||slots.some((slot,i)=>!slot.teams.includes(data.selectedRoles[i]?.team)))throw Error('请选择每个位置对应类型的角色');}else if(data.selectedRoles!==undefined)throw Error('这项能力不需要多个角色');
  if((spec.roleSlots||spec.roleCount)&&!spec.allowRepeatedRoles&&new Set(data.selectedRoles.map(r=>r.id)).size!==data.selectedRoles.length)throw Error('请选择不同的角色');
  if(spec.distinctRoleTypes&&new Set(data.selectedRoles.map(r=>r.team)).size!==data.selectedRoles.length)throw Error('请选择不同类型的角色');
  if(spec.distinctTargetGroups?.some(indices=>new Set(indices.map(i=>entry.targets[i].seatId)).size!==indices.length))throw Error('这些位置需要不同的玩家');
  if(spec.targetTeams&&entry.targets.some(p=>!spec.targetTeams.includes(p.team)))throw Error('请选择符合能力要求的玩家角色类型');
  if(spec.roleExcludeNames&&[data.selectedRole,...(data.selectedRoles||[])].some(r=>r&&spec.roleExcludeNames.includes(r.name)))throw Error('这项能力不能选择该角色');
  if(spec.excludeOwnRole&&[data.selectedRole,...(data.selectedRoles||[])].some(r=>r&&profileForRole(r)===known.profile))throw Error('这项能力不能选择自身角色');
  if(spec.excludeTravellers&&entry.targets.some(p=>p.team==='traveller'))throw Error('这项能力不能选择旅行者');
  if(data.texts!==undefined&&(!spec.textSlots||!Array.isArray(data.texts)||data.texts.length!==spec.textSlots.length||data.texts.some(t=>typeof t!=='string'||!t.trim()||t.length>2000)))throw Error('请完整填写能力信息');
  if(spec.resultRequired&&!data.texts&&!String(entry.result||'').trim())throw Error('请填写能力的信息内容');
  if(spec.numberLabel){if(!Number.isInteger(data.number)||data.number<spec.min||data.number>spec.max)throw Error('能力信息数字超出范围');}else if(data.number!==undefined)throw Error('这项能力不需要数字');
  if(spec.choices){if(!(spec.optionalChoice&&data.choice===undefined)&&!spec.choices.includes(data.choice))throw Error('请选择能力行动的结果');}else if(data.choice!==undefined)throw Error('这项能力不需要结果选项');
  return true;
 }
 function roleSlots(spec,count){if(!spec)return [];if(spec.roleCount){const n=Number(count);return Number.isInteger(n)&&n>=spec.min&&n<=spec.max?Array.from({length:n},(_,i)=>({label:(spec.roleCount.label||'选择角色')+' '+(i+1),teams:spec.roleCount.teams})):[];}return spec.roleSlots||[];}
 function describe(entry){
  const data=entry.abilityAction,spec=get(data.key),texts=data.texts;
  let sentence=!entry.targets.length&&spec.emptySentence?spec.emptySentence:spec.recordSentence,result=entry.result||'';
  if(spec.textSlots){if(texts)sentence=spec.textSentence;else if(result){sentence=spec.legacySentence;result='';}}
  if(data.key.startsWith('experimental/alsaahir/')&&data.choice)sentence=sentence.replace(/[。；]+$/,'')+'，{choice}。';
  if(data.key==='bmr/gambler/0')sentence='赌{targets}是{role}'+(data.choice?'，{choice}。':'。');
  return {sentence,texts:(texts||[]).map(t=>t.trim().replace(/[。；]+$/,'')),detail:entry.result||'',result};
 }
 const api={profiles,match,forRole,iconRoleId,get,validate,roleSlots,describe};root.GrimoireReviewActions=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
