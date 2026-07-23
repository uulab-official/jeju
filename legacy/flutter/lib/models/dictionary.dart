class Dictionary {
  JejunetApi jejunetApi;

  Dictionary({this.jejunetApi});

  Dictionary.fromJson(Map<String, dynamic> json) {
    jejunetApi = json['jejunetApi'] != null
        ? new JejunetApi.fromJson(json['jejunetApi'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if (this.jejunetApi != null) {
      data['jejunetApi'] = this.jejunetApi.toJson();
    }
    return data;
  }
}

class JejunetApi {
  String resultCode;
  String resultMsg;
  Items items;
  Query query;

  JejunetApi({this.resultCode, this.resultMsg, this.items, this.query});

  JejunetApi.fromJson(Map<String, dynamic> json) {
    resultCode = json['resultCode'];
    resultMsg = json['resultMsg'];
    items = json['list'] != null ? new Items.fromJson(json['list']) : null;
    query = json['query'] != null ? new Query.fromJson(json['query']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['resultCode'] = this.resultCode;
    data['resultMsg'] = this.resultMsg;
    if (this.items != null) {
      data['items'] = this.items.toJson();
    }
    if (this.query != null) {
      data['query'] = this.query.toJson();
    }
    return data;
  }
}

class Items {
  List<Ditem> item;

  Items({this.item});

  Items.fromJson(Map<String, dynamic> json) {
    if (json['item'] != null) {
      item = [];
      json['item'].forEach((v) {
        item.add(Ditem.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = Map<String, dynamic>();
    if (this.item != null) {
      data['item'] = this.item.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Ditem {
  String seq;
  String type;
  String name;
  String siteName;
  String index;
  String contents;
  String engContents;
  String janContents;
  String chiContents;
  String sound;
  String soundUrl;
  String use;
  String category;

  Ditem(
      {this.seq,
        this.type,
        this.name,
        this.siteName,
        this.index,
        this.contents,
        this.engContents,
        this.janContents,
        this.chiContents,
        this.sound,
        this.soundUrl,
        this.use,
        this.category});

  Ditem.fromJson(Map<String, dynamic> json) {
    seq = json['seq'];
    type = json['type'];
    name = json['name'];
    siteName = json['siteName'];
    index = json['index'];
    contents = json['contents'];
    engContents = json['engContents'];
    janContents = json['janContents'];
    chiContents = json['chiContents'];
    sound = json['sound'];
    soundUrl = json['soundUrl'];
    use = json['use'];
    category = json['category'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['seq'] = this.seq;
    data['type'] = this.type;
    data['name'] = this.name;
    data['siteName'] = this.siteName;
    data['index'] = this.index;
    data['contents'] = this.contents;
    data['engContents'] = this.engContents;
    data['janContents'] = this.janContents;
    data['chiContents'] = this.chiContents;
    data['sound'] = this.sound;
    data['soundUrl'] = this.soundUrl;
    data['use'] = this.use;
    data['category'] = this.category;
    return data;
  }
}

class Query {
  String pageSize;
  String page;
  String rows;

  Query({this.pageSize, this.page, this.rows});

  Query.fromJson(Map<String, dynamic> json) {
    pageSize = json['pageSize'];
    page = json['page'];
    rows = json['rows'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['pageSize'] = this.pageSize;
    data['page'] = this.page;
    data['rows'] = this.rows;
    return data;
  }
}