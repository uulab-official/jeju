class Keyword {
  JejunetApi jejunetApi;

  Keyword({this.jejunetApi});

  Keyword.fromJson(Map<String, dynamic> json) {
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
  List<Kitem> item;

  Items({this.item});

  Items.fromJson(Map<String, dynamic> json) {
    if (json['item'] != null) {
      item = [];
      json['item'].forEach((v) {
        item.add(Kitem.fromJson(v));
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

class Kitem {
  String seq;
  String writer;
  String name;
  String book;
  String bookPath;
  String page;
  String contents;
  String index1;
  String index2;
  String index3;
  String type;
  String obSeq;
  String use;

  Kitem({
    this.seq,
    this.writer,
    this.name,
    this.book,
    this.bookPath,
    this.page,
    this.contents,
    this.index1,
    this.index2,
    this.index3,
    this.type,
    this.obSeq,
    this.use,
  });

  Kitem.fromJson(Map<String, dynamic> json) {
    seq = json['seq'];
    writer = json['writer'];
    name = json['name'];
    book = json['book'];
    bookPath = json['bookPath'];
    page = json['page'];
    contents = json['contents'];
    index1 = json['index1'];
    index2 = json['index2'];
    index3 = json['index3'];
    type = json['type'];
    obSeq = json['obSeq'];
    use = json['use'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = Map<String, dynamic>();
    data['seq'] = this.seq;
    data['writer'] = this.writer;
    data['name'] = this.name;
    data['book'] = this.book;
    data['bookPath'] = this.bookPath;
    data['page'] = this.page;
    data['contents'] = this.contents;
    data['index1'] = this.index1;
    data['index2'] = this.index2;
    data['index3'] = this.index3;
    data['type'] = this.type;
    data['obSeq'] = this.obSeq;
    data['use'] = this.use;
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
