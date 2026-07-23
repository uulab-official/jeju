import 'package:dialect/models/dictionary.dart';
import 'package:dialect/models/keyword.dart';
import 'package:dialect/models/life_dialect.dart';
import 'package:dialect/models/proverb.dart';
import 'package:dialect/providers/dictionary_provider.dart';
import 'package:dialect/providers/keyword_provider.dart';
import 'package:dialect/providers/lifedialect_provider.dart';
import 'package:dialect/providers/proverb_provider.dart';
import 'package:dialect/screens/search/components/search_item.dart';
import 'package:dialect/widgets/search_bar.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class FavoriteScreen extends StatefulWidget {
  @override
  State<StatefulWidget> createState() => _FavoriteScreenState();
}

class _FavoriteScreenState extends State<FavoriteScreen>
    with AutomaticKeepAliveClientMixin {

  String query;

  LifeDialectProvider lifeDialectProvider;
  ProverbProvider proverbProvider;
  KeywordProvider keywordProvider;
  DictionaryProvider dictionaryProvider;

  List<Litem> Litems = [];
  List<Ditem> Ditems = [];
  List<Kitem> Kitems = [];
  List<Pitem> Pitems = [];
  List<Item> items = [];

  @override
  void initState() {
    super.initState();
    lifeDialectProvider =
        Provider.of<LifeDialectProvider>(context, listen: false);
    lifeDialectProvider.requestLifeDialects().then((value) {
      setState(() {
        Litems = lifeDialectProvider.lifeDialect.jejunetApi.items.item;
      });
    });

    proverbProvider =
        Provider.of<ProverbProvider>(context, listen: false);
    proverbProvider.requestProverbs().then((value) {
      setState(() {
        Pitems = proverbProvider.proverb.jejunetApi.items.item;
      });
    });

    dictionaryProvider =
        Provider.of<DictionaryProvider>(context, listen: false);
    dictionaryProvider.requestDictionaries().then((value) {
      setState(() {
        Ditems = dictionaryProvider.dictionary.jejunetApi.items.item;
      });
    });

    keywordProvider = Provider.of<KeywordProvider>(context, listen: false);
    keywordProvider.requestKeywords().then((value) {
      setState(() {
        Kitems = keywordProvider.keyword.jejunetApi.items.item;
      });
    });

  }

  Widget filterSearchResults() {


    var list = items.where((item) {
      return (query == null || query == "") ? true : item.name.contains(query);
    }).toList();

    if(list.length == 0 || list.length == null) {
      return Container(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '조회된 정보가 없습니다',
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: Colors.black38
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }else {
      return ListView.builder(
        shrinkWrap: true,
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        itemCount: list.length,
        itemBuilder: (context, index) {
          return SearchItem(item: list[index]);
        },
      );
    }

  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
//      resizeToAvoidBottomPadding: false,
      body: Column(
        children: [
          Stack(
            children: [
              Container(
                width: double.infinity,
                height: 220,
                padding: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.only(
                      bottomRight: Radius.circular(20),
                      bottomLeft: Radius.circular(20)),
                  color: Color(0xffffc266),
                ),
                child: Container(
                  margin: EdgeInsets.only(top: 54),
                  child: Text(
                    '검색',
                    style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: Colors.black54),
                  ),
                ),
              ),
              Container(
                margin: EdgeInsets.only(top: 100),
                padding: EdgeInsets.all(16),
                child: SearchBar(onChanged: (value) {

                  setState(() {
                    query = value;
                  });
                },),
              ),
            ],
          ),
          Expanded(
            flex: 1,
            child: Container(
              child: filterSearchResults(),
            ),
          ),
        ],
      ),
    );
  }

  @override
  bool get wantKeepAlive => true;
}

class Item {
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

  Item(
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

  Item.fromJson(Map<String, dynamic> json) {
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