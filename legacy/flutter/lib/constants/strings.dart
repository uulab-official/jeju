/// 기본 Url
final String baseUrl = "https://www.jeju.go.kr";
final String restBaseUrl = "$baseUrl/rest";
final String authority = "www.jeju.go.kr";

/// Jeju-OpenAPI-C06
/// 제주 방언색인어사전 정보
final String keywordPath = "/rest/JejuAdageIndexService/getJejuAdageIndexList";
final String keywordUrl = "$restBaseUrl/JejuAdageIndexService/getJejuAdageIndexList";

/// Jeju-OpenAPI-B03
/// 제주 속담사전 정보
final String proverbPath = "/rest/JejuAdageService/getJejuAdageServiceList";
final String proverbUrl = "$restBaseUrl/JejuAdageService/getJejuAdageServiceList";

/// Jeju-OpenAPI-B02
/// 제주 생활방언 정보
final String lifeDialectPath = "/rest/JejuLifeDialectService/getJejuLifeDialectServiceList";
final String lifeDialectUrl = "$restBaseUrl/JejuLifeDialectService/getJejuLifeDialectServiceList";

/// Jeju-OpenAPI-B01
/// 제주 방언사전 정보
final String dictionaryPath = "/rest/JejuDialectService/getJejuDialectServiceList";
final String dictionaryUrl = "$restBaseUrl/JejuDialectService/getJejuDialectServiceList";
