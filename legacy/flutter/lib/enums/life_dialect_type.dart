enum LifeDialectType {
  LB03,
}

extension LifeDialectTypeExtension on LifeDialectType {

  static const lifeDialectTypeMap = {
    LifeDialectType.LB03: "인사말",
  };

  String get text => lifeDialectTypeMap[this];
}

