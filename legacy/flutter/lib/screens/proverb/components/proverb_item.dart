import 'package:dialect/models/proverb.dart';
import 'package:dialect/screens/proverb/proverb_detail_screen.dart';
import 'package:dialect/widgets/custom_tile.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class ProverbItem extends StatelessWidget {
  final Pitem item;

  const ProverbItem({Key key, this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {
//    final Logger _logger = Logger();
//    String _name = item.name.replaceAll('\\\&\#', '');
//    String n = _name.replaceAll('\;','');
//    List<int> charCodes = [];
//
//    String q = '';
//
//    for(int i = 0; i<n.length; i++){
//      if(!(n.codeUnitAt(i) >= '0'.codeUnitAt(0) && n.codeUnitAt(i) <= '9'.codeUnitAt(0))){
//        charCodes.add(n.codeUnitAt(i));
//        q = '';
//      }else{
//        int num = int.parse(String.fromCharCode(n.codeUnitAt(i)));
//        q = q + num.toString();
//        if (q.length > 4) {
//          charCodes.add(int.parse(q));
//        }
//      }
//    }
//    String name = String.fromCharCodes(charCodes);

    return CustomTile(
      onTap: () {
        Navigator.push(context, MaterialPageRoute(
            builder: (context) => ProverbDetailScreen(item: item)
        ));
      },
      title:
      Text(
        item.name.replaceAll('n', ' ').replaceAll('\\', ''),
        style: TextStyle(
          fontFamily:'Yethan',
          fontSize: 16,
          fontWeight: FontWeight.w600
        ),
      ),
      trailing: Row(
        children: <Widget>[
          Icon(
            Icons.keyboard_arrow_right,
          ),
        ],
      ),
    );
  }
}
