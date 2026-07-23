class LifeDialect {
  JejunetApi jejunetApi;

  LifeDialect({this.jejunetApi});

  LifeDialect.fromJson(Map<String, dynamic> json) {
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
  List<Litem> item;

  Items({this.item});

  Items.fromJson(Map<String, dynamic> json) {
    if (json['item'] != null) {
      item = [];
      json['item'].forEach((v) {
        item.add(Litem.fromJson(v));
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

class Litem {
  String seq;
  String type;
  String name;
  String siteName;
  String contents;
  String original;
  String solution;
  String soundUrl;
  String image1Url;
  String category;
  String count;

  Litem({
    this.seq,
        this.type,
        this.name,
        this.siteName,
        this.contents,
        this.original,
        this.solution,
        this.soundUrl,
        this.image1Url,
        this.category,
        this.count,
      });

  Litem.fromJson(Map<String, dynamic> json) {
    seq = json['seq'];
    type = json['type'];
    name = json['name'];
    siteName = json['siteName'];
    contents = json['contents'];
    original = json['original'];
    solution = json['solution'];
    soundUrl = json['soundUrl'];
    image1Url = json['image1Url'];
    category = json['category'];
    count = json['count'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = Map<String, dynamic>();
    data['seq'] = this.seq;
    data['type'] = this.type;
    data['name'] = this.name;
    data['siteName'] = this.siteName;
    data['contents'] = this.contents;
    data['original'] = this.original;
    data['solution'] = this.solution;
    data['soundUrl'] = this.soundUrl;
    data['image1Url'] = this.image1Url;
    data['category'] = this.category;
    data['count'] = this.count;
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
