import 'package:dialect/constants/strings.dart';
import 'package:dialect/models/proverb.dart';
import 'package:flutter/widgets.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:xml2json/xml2json.dart';
import 'dart:convert' as convert;

class ProverbProvider with ChangeNotifier {
  final Logger _logger = Logger();
  var netWorkSuccess = false;

  Proverb _proverb;
  Proverb get proverb => _proverb;

  //
  ProverbProvider() {
    _logger.d("ProverbProvider init");
  }

  void setData(Proverb proverb) {
    _logger.d("ProverbProvider setData");

    _proverb = proverb;
    notifyListeners();
  }

  Future<bool> requestProverbs() async {
    _logger.d("ProverbProvider requestProverbs");
    netWorkSuccess = false;

    try {
      var queryParam = {
        "pageSize" : "999999999",
      };
      var uri = Uri.https(authority, proverbPath, queryParam);
      final response = await http.get(uri);

//      final response = await http.get(proverbUrl);
      if (response.statusCode == 200) {
        final body = response.body;
        final Xml2Json _parser = Xml2Json()..parse(body);
        final jsonString = _parser.toParker();
        var newString = jsonString.replaceAllMapped(RegExp(r'\&#[0-9]*;'), (Match m) {
          var value = m[0].replaceAll(RegExp(r'\D'), '');

          return String.fromCharCode(int.parse(value));
        });
        final json = convert.jsonDecode(newString);
        final proverb = Proverb.fromJson(json);
        setData(proverb);

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