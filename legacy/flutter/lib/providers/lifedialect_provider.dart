import 'package:dialect/constants/strings.dart';
import 'package:dialect/models/life_dialect.dart';
import 'package:flutter/widgets.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:xml2json/xml2json.dart';
import 'dart:convert' as convert;

class LifeDialectProvider with ChangeNotifier {
  final Logger _logger = Logger();
  var netWorkSuccess = false;

  LifeDialect _lifeDialect;
  LifeDialect get lifeDialect => _lifeDialect;

  //
  LifeDialectProvider() {
    _logger.d("LifeDialectProvider init");
  }

  // 제주 생활방언 정보 Set
  void setData(LifeDialect lifeDialect) {
    _logger.d("LifeDialectProvider setData");

    _lifeDialect = lifeDialect;
    notifyListeners();
  }

  // 제주 생활방언 정보 전체조회
  Future<bool> requestLifeDialects() async {
    _logger.d("LifeDialectProvider requestLifeDialects");
    netWorkSuccess = false;

    try {
      var queryParam = {
//        "type" : "LB05",
//        "page" : "1",
        "pageSize" : "999999999",
      };
      var uri = Uri.https(authority, lifeDialectPath, queryParam);
      final response = await http.get(uri);

//      final response = await http.get(lifeDialectUrl);
      if (response.statusCode == 200) {

        final body = response.body;

        final Xml2Json _parser = Xml2Json()..parse(body);
        final jsonString = _parser.toParker().replaceAll('\\', '');
        var newString = jsonString.replaceAllMapped(RegExp(r'\&#[0-9]*;'), (Match m) {
          var value = m[0].replaceAll(RegExp(r'\D'), '');

          return String.fromCharCode(int.parse(value));
        });
        final json = convert.jsonDecode(newString);
        final lifeDialect = LifeDialect.fromJson(json);
        setData(lifeDialect);

        netWorkSuccess = true;

        return true;
      }
      return false;

    } catch(e) {
      _logger.d(e.toString());
      return false;
    }
  }
}