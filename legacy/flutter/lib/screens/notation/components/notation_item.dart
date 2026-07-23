import 'package:dialect/models/notation.dart';
import 'package:flutter/material.dart';

class NotationItem extends StatelessWidget {
  final Data data;

  const NotationItem({Key key, this.data}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            margin: EdgeInsets.only(top: 24),
            padding: EdgeInsets.symmetric(vertical: 4),
            child: Text(
              data.title,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

          ListView.builder(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            itemCount: data.item.length,
            itemBuilder: (context, index) {

              var item = data.item[index];
              return NotationSubItem(item: item,);
            },
          ),
        ],
      ),
    );
  }
}

class NotationSubItem extends StatelessWidget {
  final Item item;

  const NotationSubItem({Key key, this.item}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[

        if(item.subTitle != null) Container(
          padding: EdgeInsets.only(top: 24),
          child: Text(
            item.subTitle,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Container(
          child: ListView.builder(
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            itemCount: item.subItem.length,
            itemBuilder: (context, index) {

              var subItem = item.subItem[index];

              if(subItem.type == "image") {
                return Container(
                  margin: EdgeInsets.all(8),
                  padding: EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(30),
                    color: Colors.amber,
                  ),
                    child: Image.network(subItem.value),
                );

              } else if (subItem.type == "subject") {
                return Container(
                  padding: EdgeInsets.only(top: 8),
                  child: Row(
                    children: <Widget>[
//                      Icon(Icons.fiber_manual_record,
//                      size: 12,),
                      SizedBox(width: 6),
                      Expanded(
                          child: Text(
                            subItem.value,
                            maxLines: null,
                          )
                      ),
                    ],
                  ),
                );
              } else {
                return Container(
                  child: Text(subItem.value),
                );
              }
            },
          ),
        ),
      ],
    );
  }
}
