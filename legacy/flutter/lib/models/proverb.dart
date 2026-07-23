class Proverb {
  JejunetApi jejunetApi;

  Proverb({this.jejunetApi});

  Proverb.fromJson(Map<String, dynamic> json) {
    jejunetApi = json['jejunetApi'] != null
        ? JejunetApi.fromJson(json['jejunetApi'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = Map<String, dynamic>();
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
    items = json['items'] != null ? Items.fromJson(json['items']) : null;
    query = json['query'] != null ? Query.fromJson(json['query']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = Map<String, dynamic>();
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
  List<Pitem> item;

  Items({this.item});

  Items.fromJson(Map<String, dynamic> json) {
    if (json['item'] != null) {
      item = [];
      json['item'].forEach((v) {
        item.add(Pitem.fromJson(v));
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

class Pitem {
  String seq;
  String name;
  String index;
  String contents;
  String original;
  String engContents;
  String janContents;
  String chiContents;
  String soundUrl;
  String book;

  Pitem({
    this.seq,
    this.name,
    this.index,
    this.contents,
    this.original,
    this.engContents,
    this.janContents,
    this.chiContents,
    this.soundUrl,
    this.book,
  });

  Pitem.fromJson(Map<String, dynamic> json) {
    seq = json['seq'];
    name = json['name'];
    index = json['index'];
    contents = json['contents'];
    original = json['original'];
    engContents = json['engContents'];
    janContents = json['janContents'];
    chiContents = json['chiContents'];
    soundUrl = json['soundUrl'];
    book = json['book'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = Map<String, dynamic>();
    data['seq'] = this.seq;
    data['name'] = this.name;
    data['index'] = this.index;
    data['contents'] = this.contents;
    data['original'] = this.original;
    data['engContents'] = this.engContents;
    data['janContents'] = this.janContents;
    data['chiContents'] = this.chiContents;
    data['soundUrl'] = this.soundUrl;
    data['book'] = this.book;
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
    final Map<String, dynamic> data = Map<String, dynamic>();
    data['pageSize'] = this.pageSize;
    data['page'] = this.page;
    data['rows'] = this.rows;
    return data;
  }
}
