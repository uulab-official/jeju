class Notation {
  List<Data> data;

  Notation({this.data});

  Notation.fromJson(Map<String, dynamic> json) {
    if (json['data'] != null) {
      data = [];
      json['data'].forEach((v) {
        data.add(new Data.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    if (this.data != null) {
      data['data'] = this.data.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Data {
  String title;
  List<Item> item;

  Data({this.title, this.item});

  Data.fromJson(Map<String, dynamic> json) {
    title = json['title'];
    if (json['item'] != null) {
      item = [];
      json['item'].forEach((v) {
        item.add(new Item.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['title'] = this.title;
    if (this.item != null) {
      data['item'] = this.item.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Item {
  String subTitle;
  List<SubItem> subItem;

  Item({this.subTitle, this.subItem});

  Item.fromJson(Map<String, dynamic> json) {
    subTitle = json['subTitle'];
    if (json['subItem'] != null) {
      subItem = [];
      json['subItem'].forEach((v) {
        subItem.add(new SubItem.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['subTitle'] = this.subTitle;
    if (this.subItem != null) {
      data['subItem'] = this.subItem.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class SubItem {
  String type;
  String value;

  SubItem({this.type, this.value});

  SubItem.fromJson(Map<String, dynamic> json) {
    type = json['type'];
    value = json['value'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['type'] = this.type;
    data['value'] = this.value;
    return data;
  }
}
