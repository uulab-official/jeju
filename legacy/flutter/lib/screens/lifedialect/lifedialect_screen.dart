import 'package:dialect/models/life_dialect.dart';
import 'package:dialect/providers/lifedialect_provider.dart';
import 'package:dialect/screens/lifedialect/components/lifedialect_item.dart';
import 'package:dialect/widgets/search_bar.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class LifeDialectScreen extends StatefulWidget {
  @override
  _LifeDialectScreenState createState() => _LifeDialectScreenState();
}

class _LifeDialectScreenState extends State<LifeDialectScreen> {

  LifeDialectProvider lifeDialectProvider;

  List<Litem> items = [];
  List<Litem> itemCopy = [];
  String query;

  @override
  void dispose() {
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    lifeDialectProvider = Provider.of<LifeDialectProvider>(context, listen: false);
    lifeDialectProvider.requestLifeDialects().then((value) {
      setState(() {
        items = lifeDialectProvider.lifeDialect.jejunetApi.items.item;
      });
    });
  }

  Widget filterSearchResults() {
    var netWorkSuccess = lifeDialectProvider.netWorkSuccess;

    var list = items.where((item) {
      return (query == null || query == "") ?  true : item.name.contains(query);
    }).toList();

    if (netWorkSuccess) {
      if (list.length == 0 || list.length == null) {
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
                        color: Colors.black38),
                  ),
                ],
              ),
            ],
          ),
        );
      } else {
        return ListView.builder(
          shrinkWrap: true,
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          itemCount: list.length,
          itemBuilder: (context, index) {
            return LifeDialectItem(item: list[index]);
          },
        );
      }
    } else {
      return Container(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(
              height: 16,
            ),
            Text(
              '조회중입니다',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: Colors.black38),
            )
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
//      resizeToAvoidBottomPadding: false,
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          '제주 생활방언',
          style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.black54
          ),
        ),
        elevation: 0,
        backgroundColor: Color(0xffffc266),
      ),
      body: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              color: Color(0xffffc266),
              borderRadius: BorderRadius.only(
                  bottomRight: Radius.circular(20), bottomLeft: Radius.circular(20)
              ),
            ),
            child: Container(
              padding: EdgeInsets.only(left: 16, right: 16, bottom: 32),
              child: SearchBar(onChanged: (value) {

                setState(() {
                  query = value;
                });

              },),
            ),
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
}