const framerate = 60;
const canvas = document.getElementById("gameCanvas");
const board = canvas.getContext('2d');
canvas.focus();
canvas.tabIndex = 0;

let key = {};
const gameComplexity = 10;

const xDiff = 400;
const yDiff = 300;

const cameraMode = "Player";

let camera = {xPos:xDiff,yPos:yDiff,yVel:0,xVel:0};
let player = {xPos:20,yPos:20,yVel:0,xVel:0,shoottimer:0,width:20,height:30};

let mousex = 0;
let mousey = 0;
let pointerx = 0;
let pointery = 0;

let drawArrayA = [];

let mapbounds = 600;

let mNamesNP = [{'Aaron':'AronRonRonnieRonny'},{'Abel':'AbeAbie'},{'Abner':'AbAbbie'},{'Abraham':'AbramAbeAbieBram'},{'Adam':'AdAddieAddyAde'},{'Adelbert':'AdalbertAdAdeAlBertBertieDel'},{'Adrian':'Ade'},{'Alan':'AllanAllenAl'},{'Albert':'AlBertBertie'},{'Alexander':'AlAlexAlecAleckLexSandySander'},{'Alfred':'AlAlfAlfieFredFreddieFreddy'},{'Algernon':'AlgieAlgyAlger'},{'Alister':'AllisterAlistairAlastairAlasterAl'},{'Alonso':'AlonzoAlLonLonnieLonny'},{'Alphonso':'AlfonsoAlAlfAlfieAlonsoLon'},{'Alva':'AlvahAlvanAl'},{'Alvin':'AlwinAlwynAlVinVinnyWin'},{'Ambrose':'AmbieBrose'},{'Amos':''},{'Andrew':'AndyDrew'},{'Angus':'Gus'},{'Anselm':'AnselAnse'},{'Anthony':'AntonyAntonTony'},{'Archibald':'ArchArchieBaldie'},{'Arnold':'Arnie'},{'Arthur':'ArtArtie'},{'Augustus':'AugustAugieGusGussyGustGustus'},{'Augustine':'AugustinAugieAustinGusGussyGust'},{'Austin':'(seeAugustine)'},{'Avery':'Avy'},{'Baldwin':'BaldieWin'},{'Barrett':'BarryBarrie'},{'Bartholomew':'BartBartyBartlettBartleyBatBatty'},{'Basil':'BazBasie'},{'Benedict':'BenBennieBenny'},{'Benjamin':'BenBennieBennyBenjyBenjie'},{'Bennet':'BennettBenBennieBenny'},{'Bernard':'BarnardBernieBerneyBarneyBarnie'},{'Bert':'Bertie(seeAlbertAdelbertBertramDelbertEgbertElbertGilbertHerbertHubertLambertOsbertRobertWilbert)'},{'Berthold':'BertBertie'},{'Bertram':'BertrandBertBertie'},{'Bill':'BillyBillie(SeeWilliamWillis)'},{'Blair':''},{'Blake':''},{'Boris':''},{'Bradford':'BradFord'},{'Bradley':'Brad'},{'Brady':''},{'Brandon':'BrandenBrandBrandy'},{'Brenton':'Brent'},{'Bret':'Brett'},{'Brian':'BryanBryant'},{'Broderick':'BrodieBrodyBradyRickRicky'},{'Bruce':''},{'Bruno':''},{'Burton':'Burt'},{'Byron':'RonRonnieRonny'},{'Caleb':'Cal'},{'Calvin':'CalVinVinny'},{'Cameron':'CamRonRonny'},{'Carey':'CaryCarry'},{'Carl':'Karl'},{'Carol':'CarrolCarroll'},{'Casey':'Kasey'},{'Caspar':'CasperCasCass'},{'Cassius':'CasCass'},{'Cecil':'Cis'},{'Cedric':'CedRickRicky'},{'Charles':'CharlieCharleyChuckChadChas'},{'Chester':'Chet'},{'Christian':'ChrisChristyKit'},{'Christopher':'KristopherChrisKrisCrisChristyKitKesterKristofTophTopher'},{'Clarence':'ClareClair'},{'Clare':'Clair'},{'Clark':'Clarke'},{'Claude':'Claud'},{'Clayton':'Clay'},{'Clement':'Clem'},{'Clifford':'CliffFord'},{'Clinton':'Clint'},{'Clive':''},{'Clyde':''},{'Cody':''},{'Colin':'CollinCole'},{'Conrad':'ConConnieConny'},{'Corey':'Cory'},{'Cornelius':'ConnieConnyCornyCorneyCory'},{'Craig':''},{'Curtis':'Curt'},{'Cyril':'Cy'},{'Cyrus':'Cy'},{'Dale':''},{'Daniel':'DanDanny'},{'Darrell':'DarrelDarrylDarylDarry'},{'David':'DaveDaveyDavieDavy'},{'Dean':'Deane'},{'Delbert':'DelBertBertie'},{'Dennis':'DenisDenDenny'},{'Derek':'DerrickDerryRickRicky'},{'Desmond':'Des'},{'Dexter':'Dex'},{'Dominic':'DominickDomenicDomenickDomNickNicky'},{'Don':'DonnieDonny'},{'Donald':'DonDonnieDonny'},{'Donovan':'DonDonnieDonny'},{'Dorian':''},{'Douglas':'DouglassDoug'},{'Doyle':''},{'Drew':'(seeAndrew)'},{'Duane':'Dwayne'},{'Dudley':'DudDuddy'},{'Duke':''},{'Duncan':'DunnyDunk'},{'Dustin':'Dusty'},{'Dwight':''},{'Dylan':'Dillon'},{'Earl':'Earle'},{'Edgar':'EdEddieEddyNed'},{'Edmund':'EdmondEdEddieEddyNedTed'},{'Edward':'EdEddieEddyNedTedTeddy'},{'Edwin':'EdEddieEddyNed'},{'Egbert':'BertBertie'},{'Elbert':'ElBertBertie'},{'Eldred':'El'},{'Elijah':'EliasEliLige'},{'Elliot':'ElliottEl'},{'Ellis':'El'},{'Elmer':'El'},{'Elton':'AltonElAl'},{'Elvin':'ElwinElwynElVinVinnyWin'},{'Elvis':'El'},{'Elwood':'ElWoody'},{'Emery':'EmmeryEmoryEm'},{'Emil':'EmileEm'},{'Emmanuel':'EmanuelImmanuelManuelMannyMannie'},{'Emmet':'EmmettEm'},{'Eric':'ErikErickRickRicky'},{'Ernest':'EarnestErnie'},{'Errol':''},{'Ervin':'ErwinIrvinIrvineIrvingIrwinErvVinWin'},{'Ethan':''},{'Eugene':'Gene'},{'Eustace':'StacyStacey'},{'Evan':'Ev'},{'Everard':'Ev'},{'Everett':'Ev'},{'Fabian':'FabeFab'},{'Felix':'Lix'},{'Ferdinand':'FerdieFredFreddie'},{'Fergus':'FergusonFergie'},{'Floyd':'Floy(seeLloyd)'},{'Ford':'(seeBradfordCliffordSanford)'},{'Francis':'FrankFrankieFrankyFran'},{'Franklin':'FranklynFrankFrankieFranky'},{'Frederick':'FredericFredrickFredricFredFreddieFreddyRickRicky'},{'Fred':'Freddie(seeAlfredFrederickWilfredWinfred)'},{'Gabriel':'GabeGabby'},{'Garrett':'GarretGaryGarr'},{'Geoffrey':'JeffreyJefferyJeff'},{'George':'GeorgieGeordie'},{'Gerald':'GerardGerryJerry'},{'Gilbert':'GilBert'},{'Glenn':'Glen'},{'Gordon':'GordyDon'},{'Graham':''},{'Grant':''},{'Gregory':'GregorGregGregg'},{'Griffith':'GriffinGriff'},{'Guy':''},{'Harold':'HalHarry'},{'Harris':'HarrisonHarry'},{'Harvey':'Harve'},{'Hector':''},{'Henry':'HarryHankHal'},{'Herbert':'HerbBertBertie'},{'Herman':'MannyMannie'},{'Hilary':'HillaryHillHillieHilly'},{'Homer':''},{'Horace':'Horatio'},{'Howard':'Howie'},{'Hubert':'HughBertBertieHube'},{'Hugh':'HughieHugo'},{'Humphrey':'HumphryHumph'},{'Ian':''},{'Ignatius':'IggyNate'},{'Immanuel':'MannyMannie(seeEmmanuel)'},{'Irvin':'IrvineIrvingIrwin(seeErvin)'},{'Isaac':'IsaakIke'},{'Isidore':'IsidorIsadoreIsadorIzzy'},{'Ivor':''},{'Jack':'JackieJacky(seeJohn)'},{'Jacob':'JakeJay'},{'James':'JimJimmyJimmieJamieJem'},{'Jared':'Jerry'},{'Jarvis':'JervisJerry'},{'Jason':'Jay'},{'Jasper':'Jay'},{'Jefferson':'Jeff'},{'Jeffrey':'JefferyGeoffreyJeff'},{'Jeremy':'JeremiahJerry'},{'Jerome':'Jerry'},{'Jesse':'JessJessieJessy'},{'Joel':'Joe'},{'John':'JackJackieJackyJohnny'},{'Jonathan':'JonJonny'},{'Joseph':'JoeJoeyJoJosJody'},{'Joshua':'Josh'},{'Judson':'JudSonny'},{'Julian':'JuliusJuleJules'},{'Justin':'JusJust'},{'Karl':'Carl'},{'Keith':''},{'Kelly':'Kelley'},{'Kelvin':'KelKelly'},{'Kendall':'KenKenny'},{'Kendrick':'KenKennyRickRicky'},{'Kenneth':'KenKenny'},{'Kent':'KenKenny'},{'Kevin':'Kev'},{'Kirk':''},{'Kristopher':'KristoferKrisKitKester(seeChristopher)'},{'Kurt':'Curt'},{'Kyle':''},{'Lambert':'Bert'},{'Lamont':'MontyMonte'},{'Lancelot':'LauncelotLance'},{'Laurence':'LawrenceLorenceLorenzoLarryLarsLaurieLawrieLorenLauren'},{'Lee':'Leigh'},{'Leo':'LeonLee'},{'Leonard':'LeoLeonLenLennyLennie'},{'Leopold':'LeoPoldie'},{'Leroy':'LeeroyLeeRoy'},{'Leslie':'LesleyLes'},{'Lester':'Les'},{'Lewis':'LewLewie'},{'Lincoln':'LinLincLynn'},{'Lindon':'LyndonLinLynn'},{'Lindsay':'LindseyLinLynn'},{'Linus':''},{'Lionel':'LeoLeon'},{'Llewellyn':'LlewLyn'},{'Lloyd':'LoydLoydeFloydLoyFloy'},{'Logan':''},{'Lonnie':'Lonny(seeAlonso)'},{'Louis':'LouLouie'},{'Lowell':'Lovell'},{'Lucian':'LuciusLuLuke'},{'Luke':'LucasLuke'},{'Luther':'LootLuth'},{'Lyle':'Lyall'},{'Lynn':''},{'Malcolm':'MalMalcMac'},{'Manuel':'MannyMannie(seeEmmanuel)'},{'Marion':''},{'Mark':'MarcMarcusMarkMarc'},{'Marshall':'Marshal'},{'Martin':'MartMarty'},{'Marvin':'MervinMarvMerv'},{'Matthew':'MattMatMattyMattie'},{'Matthias':'MattMatMattyMattie'},{'Maurice':'MorrisMorryMoreyMoe'},{'Maximilian':'Max'},{'Maxwell':'Max'},{'Maynard':''},{'Melvin':'Mel'},{'Merlin':'Merle'},{'Merrill':'MerrilMerill'},{'Michael':'MikeMikeyMickMickeyMicky'},{'Miles':'MylesMilo'},{'Milo':''},{'Milton':'Milt'},{'Mitchell':'Mitch'},{'Monroe':'Munroe'},{'Montague':'MontyMonte'},{'Montgomery':'MontyMonte'},{'Morgan':'Mo'},{'Mortimer':'MortMorty'},{'Morton':'MortMorty'},{'Moses':'MoMoeMoseMoss'},{'Murray':'Murry'},{'Nathan':'NathanielNatNateNatty'},{'Neal':'Neil'},{'Nelson':'NelNellNels'},{'Nevill':'NevilNevileNevilleNev'},{'Newton':'Newt'},{'Nicholas':'NicolasNickNickyNicolColeColin'},{'Nigel':'Nige'},{'Noah':''},{'Noel':'Nowell'},{'Norbert':'Bert'},{'Norris':'NorNorrie'},{'Norman':'NormNormieNorNorrie'},{'Norton':'Nort'},{'Oliver':'OllieNollNollieNolly'},{'Orson':''},{'Orville':'OrvOllie'},{'Osbert':'OssyOzzieOzzyBert'},{'Osborn':'OsborneOssyOzzieOzzy'},{'Oscar':'OsOssy'},{'Osmond':'OsmundOssyOzzieOzzy'},{'Oswald':'OswoldOsOssyOzOzzieOzzy'},{'Otis':''},{'Owen':''},{'Patrick':'PatPaddyPatsy'},{'Paul':'Pauly'},{'Percival':'PercevalPercyPerce'},{'Perry':''},{'Peter':'PetePetiePetey'},{'Philip':'PhillipPhilPip'},{'Preston':''},{'Quentin':'QuintinQuentonQuintonQuinn'},{'Quincy':'QuinceyQuinn'},{'Ralph':'RaffRafeRalphy'},{'Randall':'RandalRandRandy'},{'Randolph':'RandRandyDolph'},{'Raphael':'RafaelRaffRafe'},{'Raymond':'RaymundRay'},{'Reginald':'RegReggieRennyRex'},{'Rene':''},{'Reuben':'RubenRubinRubeRuby'},{'Reynold':'Ray'},{'Richard':'DickRickRickyRichRichie'},{'Rick':'Ricky(seeCedricDerekEricFrederickRichardRodericBroderickKendrick)'},{'Robert':'BobBobbieBobbyDobRobRobbieRobbyRobinBert'},{'Roderic':'RoderickRodRoddyRickRicky'},{'Rodney':'RodRoddy'},{'Roger':'RodgerRodRoddyRodgeRoge'},{'Roland':'RowlandRollyRolyRowlyOrlando'},{'Rolph':'RolfRolfe(seeRudolph)'},{'Roman':'RomRomy'},{'Ronald':'RonRonnieRonny'},{'Ron':'RonnieRonny(seeAaronByronCameronRonald)'},{'Roscoe':'Ross'},{'Ross':''},{'Roy':''},{'Rudolph':'RudolfRudyRolfRolphDolphDolf'},{'Rufus':'Rufe'},{'Rupert':''},{'Russell':'RusselRuss'},{'Ryan':''},{'Samson':'SampsonSamSammy'},{'Samuel':'SamSammy'},{'Sanford':'SandyFord'},{'Saul':''},{'Scott':'Scotty'},{'Sean':'ShaunShawnShane'},{'Sebastian':'SebBass'},{'Serge':''},{'Seth':''},{'Seymour':'MoreySy'},{'Shannon':'Shanon'},{'Sheldon':'ShellyShelDon'},{'Shelley':'ShellyShellieShel'},{'Sherman':''},{'Shelton':'ShellyShelTony'},{'Sidney':'SydneySidSyd'},{'Silas':'SiSy'},{'Silvester':'SylvesterSylVester'},{'Simeon':'SimSimieSimmy'},{'Simon':'SiSySimSimieSimmy'},{'Solomon':'SolSollySal'},{'Sonny':'Son'},{'Spencer':''},{'Stacy':'Stacey(seeEustace)'},{'Stanley':'Stan'},{'Stephen':'StevenStephanSteffanStefanSteveStevieStephSteffStef'},{'Stuart':'StewartStuStew'},{'Terence':'TerrenceTerranceTerry'},{'Thaddeus':'ThadeusTadThad'},{'Theodore':'TheodorTedTeddyTheoTerry'},{'Thomas':'TomTommy'},{'Timothy':'TimTimmy'},{'Tobias':'TobyTobiTobie'},{'Todd':''},{'Tony':'(seeAnthony)'},{'Tracy':'Tracey'},{'Travis':'Trav'},{'Trenton':'Trent'},{'Trevor':'Trev'},{'Tristram':'TristamTristanTris'},{'Troy':''},{'Tyler':'Ty'},{'Tyrone':'TyronTy'},{'Ulysses':'UlyUliLyss'},{'Uriah':'UriasUriUria'},{'Valentine':'ValentinVal'},{'Valerian':'ValeriusVal'},{'Van':''},{'Vance':'Van'},{'Vaughan':'Vaughn'},{'Vernon':'VernVerne'},{'Victor':'VicVick'},{'Vincent':'VinceVinVinny'},{'Virgil':'VergilVirge'},{'Wallace':'WallisWallyWallie'},{'Waldo':''},{'Walter':'WaltWallyWallie'},{'Warren':''},{'Wayne':''},{'Wesley':'Wes'},{'Wendell':'DellDel'},{'Wilbert':'WillWillieWillyBert'},{'Wilbur':'WilberWillWillieWilly'},{'Wiley':'WillWillieWilly'},{'Wilfred':'WilfridWillWillieWillyFredFreddieFreddy'},{'Willard':'WillWillieWilly'},{'William':'BillBillyBillieWillWillieWillyLiam'},{'Willis':'BillBillyBillieWillWillieWilly'},{'Wilson':'WillWillieWilly'},{'Winfred':'WinfridWinWinnieWinnyFredFreddieFreddy'},{'Winston':'WinWinnieWinny'},{'Woodrow':'WoodWoody'},{'Xavier':'Zave'},{'Zachary':'ZachariahZachariasZackZackyZac'}]
let fNamesNP = [{'Abigail':'AbbieAbbyGailNabby'},{'Ada':'Adie'},{'Adelaide':'AddieAdelaDellDellaHeidi'},{'Adele':'AdelleAdelaAddieDellDella'},{'Adeline':'AdelinaAdalineAddieAlineDellDella'},{'Adrienne':'AdrianaAdie'},{'Agatha':'Aggie'},{'Agnes':'AggieNessNessie'},{'Aileen':'EileenAleneAllieLena'},{'Alana':'AllieLana'},{'Alberta':'AllieBertie'},{'Albertina':'AlbertineAllieBertieTina'},{'Alexandra':'AlexandriaAlexAlixAlexaAllaAllieAliLexySandraSandy'},{'Alexis':'Alex'},{'Alfreda':'AlfieAlfyFriedaFredaFreddieFreddy'},{'Alice':'AliciaAlyceAlisaAlissaAlyssaAllieAllyAliElsieLisa'},{'Alison':'AllisonAlysonAllysonAllieAllyAli'},{'Alma':''},{'Althea':'Thea'},{'Alvina':'AlvenaVinaVinnieVinny'},{'Amabel':'MabelMabMabsMabbie(seeMabel)'},{'Amanda':'Mandy'},{'Amber':''},{'Amelia':'AmaliaAmyMillieMilly'},{'Amy':'AimeeAmie'},{'Anastasia':'AnaStacyStacey'},{'Andrea':'Andy'},{'Angela':'AngelicaAngelinaAngelineAngelAngie'},{'Anita':'AnaNita'},{'Anna':'AnnAnneAnnAnnieNancyNancieNanceNanNanaNannyNanetteNannetteNina'},{'Annabel':'AnnabelleAnabelAnnAnnaBelBelleBell'},{'Annette':'AnnettaAnnieNettaNettieNetty'},{'Anthea':'Thea'},{'Antoinette':'NettieNettyNetNettaToniTonyToyToi'},{'Antonia':'ToniTonyTonyaTonia'},{'April':''},{'Arabella':'ArabelArabelleBelBellBelleBella'},{'Arlene':'ArlineArleenArlyneLenaArlyLynn'},{'Ashley':'Ash'},{'Audrey':'AudraAudieDee'},{'Augusta':'AggyAugieGussieGustaGusty'},{'Augustina':'AggyAugieGussieGustaGustyInaTina'},{'Aurora':'OrrieRori'},{'Ava':''},{'Barbara':'BabBabsBabbieBarbieBabette'},{'Beatrice':'BeatrixBeaBeeBeattieTrixieTrissieTrissy'},{'Belinda':'BelBellBelleLindaLindyLinLynn'},{'Belle':'BellBelBella(seeAnnabelArabellaIsabelRosabelBelinda)'},{'Berenice':'BerniceBernie'},{'Bertha':'BertaBertie'},{'Betty':'(seeElizabeth)'},{'Beverly':'BeverleyBev'},{'Blair':'Blaire'},{'Blanche':'Blanch'},{'Blythe':'Blithe'},{'Bonnie':'Bonny'},{'Brenda':'BrendieBrandy'},{'Brett':'BretBretta'},{'Bridget':'BridgetteBrigidBrigitBiddieBiddyBridieBrideyBrieBreeBrita'},{'Brittany':'BrittneyBritneyBritBrittBritaBrie'},{'Camille':'CamillaCamileCamilaCammieCammyMillie'},{'Candace':'CandiceCandy'},{'Caren':'CarinCarynCarrie'},{'Carla':'CarlieCarly(seeCaroline)'},{'Carlotta':'CarlotaLottaLottieLotty(seeCharlotte)'},{'Carmen':''},{'Carol':'CaroleCarrolCarrollKarolCarrieCarry(seeCaroline)'},{'Caroline':'CarolynCarolinaCarlyneCarlineKarolineCarrieCarryCaddieCaddyCarlieCarlyCallieCallyCarolLynnLynneLinLina'},{'Cassandra':'CassCassieCasseyCaseySandraSandy'},{'Catherine':'CathrynCatherynCatharineCathleenCatCattieCattyCathieCathyCassieKitKittyKittie'},{'Cecilia':'CecilliaCeceliaCecileCecilyCicelyCisCissySissyCelia'},{'Celeste':'CelieLessie'},{'Celestine':'CelestinaCelieLessieTina'},{'Celia':'CelieCel'},{'Celine':'Celina(seeSelina)'},{'Charity':'ChattieChattyCherry'},{'Charlene':'CharleenCharlineCharlyneCharlieLynn'},{'Charlotte':'LottaLottieLottyLolaLolitaChattieCharlie'},{'Cheryl':'CherieCheri'},{'Christine':'ChristinaChristianaChristianChrisChristyChristieChristaChrissieKitTina'},{'Clara':'ClaireClareClair'},{'Clarice':'ClarissaClaraClareClair'},{'Claudia':'ClaudineClaudetteClaudie'},{'Clemency':'ClemClemmie'},{'Clementine':'ClementinaClemClemmieTina'},{'Colleen':'ColeenLena'},{'Constance':'ConnieConnyConnee'},{'Cora':'CoriCorrieCoreyCory'},{'Cordelia':'CordyCoriDelia'},{'Corinne':'CorinnaCorynneCorrineCorineCorinaCoraCoriCorrieCory'},{'Cornelia':'ConnieConnyCornyCoriNellNellie'},{'Courtney':'CourtCourtie'},{'Crystal':'ChrystalCrysChris'},{'Cynthia':'Cindy'},{'Daisy':'Daysie'},{'Danielle':'DanielaDaniDanny'},{'Daphne':'DaphDaphie'},{'Darlene':'DarleenDarlyneLenaDarla'},{'Deborah':'DebbieDebbyDebra'},{'Delia':'DellDella'},{'Delilah':'DellDellaLila'},{'Dell':'Della(seeAdelaideAdeleAdelineDeliaDelilah)'},{'Denise':'DeniceDenyseDenny'},{'Diana':'DianeDianneDi'},{'Dinah':'DinaDi'},{'Dolores':'DeloresLolaLolita'},{'Dominique':'DominicaMinnieNickiNikki'},{'Donna':''},{'Dora':'DorrieDori(seeDorothy)'},{'Doreen':'DoreneDorrie'},{'Doris':'DorrisDorrie'},{'Dorothy':'DorotheaDoraDorrieDollDollyDodieDotDottieDottyDee'},{'Edith':'EdythEdytheEdieEdyeDee'},{'Edna':'Eddie'},{'Elaine':'AlaineHelaineEllieEllyLainie'},{'Eleanor':'ElinorEleonoraEleonoreElenoreEllaEllieEllyNellNellieNellyNoraLallyLallie'},{'Elisa':'ElizaElisiaElissaEliseElyseElsaElsie(seeElizabeth)'},{'Elizabeth':'ElisabethBettyBettieBetBettBetteBettaBetsyBetseyBetsiBethBessBessieBessyBettinaElsieElisaElsaElizaEllieEllyIlseLizLizzyLizzieLizaLisaLiseLisetteLizetteLisbetLizbethLibby'},{'Ella':'EllieEllyNellieNelly(seeEleanorElaineHelen)'},{'Ellen':'(seeHelen)'},{'Eloise':'HeloiseLois'},{'Elsie':'(seeAliceElizabeth)'},{'Elvina':'ElvineVinaVinnieVinny'},{'Elvira':'AlviraElvieElva'},{'Emily':'EmilieEmiliaEmEmmyEmmieMillieMilly'},{'Emma':'EmEmmEmmyEmmie'},{'Erica':'ErikaErickaRickyRickie'},{'Erin':''},{'Ernestine':'EarnestineErnaErnieTina'},{'Estella':'EstelleEssieEssyStella'},{'Esther':'EsterHesterEssieEssyEttieEttyHettieHettyHessy'},{'Ethel':'Eth'},{'Etta':'EttieEtty(seeHenriettaEstherLorettaMarietta)'},{'Eugenia':'EugenieGeneGenie'},{'Eulalia':'EulaLallyLallie'},{'Eunice':'EunyEunie'},{'Euphemia':'EuphemieEffieEffyEuphiePhemie'},{'Eustacia':'StacyStaceyStacia'},{'Eve':'EvaEvie'},{'Eveline':'EvelynEvelynneEveleenEvelinaEveEvieEvvieLynn'},{'Evangeline':'EvangelinaEveEvieAngieLynn'},{'Faith':'FaeFayFaye'},{'Felicia':'FelicityFeliceFeeFel'},{'Florence':'FloFloyFlossFlossieFlossyFloraFlorrie'},{'Frances':'FanFannieFannyFranFrannieFrannyFrancieFrancyFranceFrankieFranky'},{'Francesca':'FranciscaFranCesca'},{'Francine':'FanFannieFannyFranFrannieFrannyFrancieFrancyFranceFrankieFranky'},{'Frederica':'FrederikaFrederickaFredaFreddieFreddyRickyRickie'},{'Gabrielle':'GabrielaGabriellaGabbyGabiGaby'},{'Genevieve':'GeneGinnyJennyViv'},{'Georgina':'GeorgineGeorgieGina'},{'Geraldine':'GerryGerrieGerriJerryDina'},{'Gertrude':'GertieTrudieTrudy'},{'Gillian':'JillianJill'},{'Gina':'(seeReginaGeorgina)'},{'Gladys':'Glad'},{'Glenda':'Glen'},{'Gloria':'Glory'},{'Goldie':'Goldy'},{'Grace':'Gracie'},{'Gwendolen':'GwendolynGwenGwendaWendy'},{'Hannah':'HannaAnnAnnieNanaNanny'},{'Harriet':'HattieHatty'},{'Hazel':''},{'Heather':'HettieHetty'},{'Helen':'HelenaElenaEllenNellNellieNellyEllieEllyLenaLalaLallyLallie'},{'Helga':''},{'Henrietta':'EttaEttieEttyHettieHettyNettieNetty'},{'Hester':'(seeEsther)'},{'Hilary':'HillaryHillHillieHilly'},{'Hilda':'HyldaHildie'},{'Holly':''},{'Honora':'HonoriaHonorNoraNorahHoney'},{'Hope':''},{'Ida':''},{'Imogen':'ImogeneImmyImmie'},{'Ingrid':''},{'Irene':'RenieRena'},{'Iris':''},{'Irma':'Erma'},{'Isabel':'IsabelleIsabellaBelBellBelleBellaIssyIzzyTibbie'},{'Isadora':'IsidoraIssyIzzyDora'},{'Jacqueline':'JacquelynJackieJacky'},{'Jamesina':'JamieJaymeJaime'},{'Jane':'JanieJaneyJennyJennieJenJanet'},{'Janet':'JanetteJanettaJanNettieNettyNetta'},{'Janice':'JanisJeniceJan'},{'Jean':'JeanneJeanieJeannie'},{'Jeannette':'JeannettaJeanetteJeanieJeannieNettieNettyNetta'},{'Jemima':'JemJemmaMimaMimi'},{'Jennifer':'JenJennyJennieJenne'},{'Jenny':'(seeJaneJenniferVirginiaGenevieve)'},{'Jessica':'JessJessie'},{'Jill':'(seeGillian)'},{'Joanna':'JoanneJoannJohannaJoanJoJody'},{'Joceline':'JocelynJoLynn'},{'Josephine':'JosephaJoJosieJoseyJozyJodyPheny'},{'Joyce':'Joy'},{'Judith':'JudyJudieJudeJodyJodie'},{'Julia':'JulieJule'},{'Julianne':'JulianaJulieJule'},{'Juliet':'JulietteJulieJule'},{'June':''},{'Justina':'JustineTina'},{'Karen':'KarinKarynKariKarrie'},{'Katherine':'KatharineKathrynKathrineKathrynneKatrinaKateKathieKathyKatieKatyKayKattyKattieKitKittyKittie'},{'Kathleen':'KathleneKathlynKathlynneKathieKathyKatieKatyKattyKattie'},{'Kelly':'KellieKelliKelley'},{'Kimberly':'KimberleyKim'},{'Kristina':'KristinKristineKristenKrisKristiKristyKristieKrista'},{'Laura':'LaurieLauriLolly'},{'Laureen':'LaureneLaurenaLaurineLaurenLaurie'},{'Laurel':'Laurie'},{'Laverne':'LavernaVernaVerna'},{'Lavinia':'VinaVinnie'},{'Leah':'LeaLeeLeigh'},{'Leila':'LeilahLelaLila'},{'Lena':'(seeHelenAileenArleneDarleneMagdalene)'},{'Leona':'LeeLeonie'},{'Leonora':'LeonoreLenoraLenoreNora'},{'Leslie':'LesleyLes'},{'Leticia':'LetitiaLettieTisha'},{'Lillian':'LilianLilyLillyLiliLilliLilLillie'},{'Lily':'LillyLiliLilliLilLillie'},{'Linda':'LyndaLindyLinLynnLynne'},{'Lindsay':'LindseyLinLynn'},{'Lisa':'(seeAliceElizabethMelissa'},{'Lois':'(seeEloiseLouise)'},{'Lona':'LoniLonieLonnie'},{'Lora':'LoriLorieLorriLorrie'},{'Lorena':'LoreneLoreenLorineLoriLorieLorriLorrie'},{'Lorna':''},{'Loretta':'LoretteLoriLorrieEttaRetta'},{'Lorinda':'LaurindaLoriLorieLorrieLaurie'},{'Lorraine':'LorrainLoraineLoraLoriLorieLorrie'},{'Lottie':'LottyLotta(seeCharlotteCarlotta)'},{'Louise':'LouisaLouLuLuluLulaLois'},{'Lucille':'LucileLuLucyLucky'},{'Lucinda':'LuLucyLuckyCindy'},{'Lucy':'LucieLuciLuciaLuLuluLuceLucky(seeLucilleLucinda)'},{'Lydia':'LiddyLyddie'},{'Lynn':'Lynne(seeCarolineMarilynLindaArleneEvelynandothernameswith-line/lyn)'},{'Mabel':'MabelleMableMabMabsMabbie(seeAmabel)'},{'Madeleine':'MadelineMadelynMaddieMaddyMady'},{'Magdalene':'MagdalenMagdalenaMagdalineMagdaMagsieLena'},{'Marcia':'MarcieMarcyMarci'},{'Margaret':'MargaritaMargueriteMargretMaggieMargeMargieMarjorieMargeryMadgeMargotMargoMagsieMaisieDaisyMamieMaidieMaeMayMegMeganPeggyGretaGretchenRita'},{'Marianne':'MariannaMaryannMaryanneMarianMaryAnn'},{'Marilyn':'MarilynnMarylinMarleneMarlynMaryLynn'},{'Maribel':'MaribelleMaryBell'},{'Marietta':'MariettMarietteMaryEttaEttieEtty'},{'Marina':''},{'Marion':''},{'Marjorie':'MarjoryMargeryMargeMargie(seeMargaret)'},{'Martha':'MartaMartyMartieMatMattieMattyPatPattiePatty'},{'Martina':'MartineMartyMartie'},{'Mary':'MariaMarie'},{'Mary':'MaeMayMollMollyMolliePollyMamieMimiMinnie'},{'Matilda':'MathildaMatMattieMattyMaudMaudePattyPattieTildaTillieTilly'},{'Maud':'MaudeMaudieMaudy(seeMatilda)'},{'Maureen':'MaureneMauraMary'},{'Maxine':'MaxMaxie'},{'Megan':'Meg(seeMargaret)'},{'Melanie':'MelanyMelMellie'},{'Melinda':'MelMellieLindaMindy'},{'Melissa':'MelMellieMissieMissyLisaLissa'},{'Mercedes':'MercySadie'},{'Meredith':'Merry'},{'Michelle':'MicheleMickeyShelly'},{'Mildred':'MillieMilly'},{'Millicent':'MilicentMelicentMillieMilly'},{'Minnie':'MinnaMina(seeWilhelminaMary)'},{'Mirabel':'MirabellaMiraBella'},{'Miranda':'Randy'},{'Miriam':'MyriamMimiMiriMira'},{'Moira':'Moyra'},{'Molly':'MollieMollPolly(seeMary)'},{'Mona':''},{'Monica':'Nicki'},{'Morgan':''},{'Muriel':''},{'Myra':'Mira'},{'Myrtle':''},{'Nadine':'NadaDee'},{'Natalie':'NathalieNataliaNatashaNattieNatty'},{'Nancy':'(seeAnna)'},{'Nell':'NelleNellieNelly(seeEleanorHelenCornelia)'},{'Nettie':'NettyNetta(seeAnnetteAntoinetteHenriettaJanetJeannette)'},{'Nicki':'(seeDominiqueMonicaNicoleVeronica)'},{'Nicole':'NickyNickiNikkiNikky'},{'Nina':'(seeAnna)'},{'Noel':'NoelleElle'},{'Nora':'NorahNorrieNorry'},{'Nora':'(seeEleanorLeonoraNoreenHonora)'},{'Noreen':'NoreneNora'},{'Norma':'Normie'},{'Octavia':'TaveTavyTavia'},{'Olive':'OliviaOllieOllyNollieLivLivvyLivia'},{'Olympia':''},{'Ophelia':''},{'Pamela':'PamPammiePammy'},{'Pansy':''},{'Patricia':'PatPattyPattiPattiePatsyTriciaTrishaTrishTrissieTrissy'},{'Paula':'PaulinaPaulinePaulie'},{'Pearl':'Pearlie'},{'Peggy':'Peg(seeMargaret)'},{'Penelope':'PenPenny'},{'Phoebe':'PhebePheb'},{'Phyllis':'PhylPhylliePhil'},{'Polly':'(seeMaryMolly)'},{'Priscilla':'Prissy'},{'Prudence':'PrudiePrudyPruePru'},{'Rachel':'RachieRaeRayRache'},{'Raquel':'KellyKellie'},{'Rebecca':'RebekahBeckyBeckieBeccaBeckReba'},{'Regina':'ReggieRayGinaGinnyRena'},{'Renata':'NataNatieRennieRennyRenae'},{'Renee':'(seeRenata)'},{'Rhoda':'Rodie'},{'Rhonda':''},{'Roberta':'RobbieRobbyRobinRobynBobbieBobbyBertaBertie'},{'Rose':'RosaRosieRosy'},{'Rosabel':'RosabelleRosabellaRoseRosieRosyBell'},{'Rosalie':'RosaleeRoseRosieRosy'},{'Rosaline':'RosalynRoseRosieRosy'},{'Rosalind':'RosalindaRoseRosieRosyLinda'},{'Roseanna':'RosannaRosanneRoseRosieRosy'},{'Rosemary':'RosemarieRoseRosieRosy'},{'Rowena':'RonaRonie'},{'Roxanne':'RoxannaRoxanaRoxieRoxy'},{'Ruby':'RubinaRubyRubie'},{'Ruth':'Ruthie'},{'Sabrina':'BrinaSabby'},{'Samantha':'SamSammieSammy'},{'Sarah':'SaraSalSallySallieSadie'},{'Selina':'SelenaSeleneCelineCelinaCelenaLenaLina'},{'Selma':'Selmie'},{'Shannon':'Shanon'},{'Sharon':'SharronSharenSharynShariSharrie'},{'Shauna':'ShawnaSheena'},{'Sheila':''},{'Shelley':'ShellyShellie'},{'Shirley':'ShirleeShirlieShirl'},{'Sibyl':'SybilSibylleSybillSybleSibSibbieSibby'},{'Sidney':'SydneySidSyd'},{'Sonia':'Sonya'},{'Sophia':'SophieSophy'},{'Stacy':'StaceyStacieStaci(seeAnastasiaEustacia)'},{'Stephanie':'StephanyStephaniaStephanaStefanieStefaniaStefanaSteffanieStephStephieSteffSteffyStevie'},{'Stella':'(seeEstelle)'},{'Susan':'SusannaSusannahSusanneSuzanneSueSusieSusiSusySuzieSuzySukie'},{'Sylvia':'SilviaSylSylvie'},{'Tabitha':'Tabby'},{'Tamara':'TamarTammyTammie'},{'Tanya':'Tania'},{'Teresa':'TheresaThereseTerryTerriTeriTerrieTessTessaTessieTracyTrissieTrissy'},{'Theodora':'DoraTheo'},{'Thelma':''},{'Tiffany':'TiffTiffy'},{'Tina':'(seeChristineErnestineBettinaAlbertinaAugustinaClementinaJustina)'},{'Tracy':'TraceyTracieTraci(seeTeresa)'},{'Ulrica':'Ulrika'},{'Una':''},{'Ursula':'UrsaUrsieSulie'},{'Valentina':'ValVallie'},{'Valerie':'ValeryValeriaValVallie'},{'Vanessa':'VanVannieVannaNessaEssa'},{'Vera':''},{'Verna':'(seeLaverne)'},{'Veronica':'NickyNickiRonnieRonniRonny'},{'Victoria':'VicVickVickieVickyVickiVikiVikki'},{'Vida':''},{'Viola':'Vi'},{'Violet':'VioletteViolettaViLettie'},{'Virginia':'GingerGinnyJinnyJennyVirgie'},{'Vivian':'VivienViv'},{'Wanda':''},{'Wendy':'(seeGwendolen)'},{'Wilhelmina':'WillaWilmaWillieBillieMinaMinnie'},{'Wilma':''},{'Winifred':'WinnieFredaFreddie'},{'Yolanda':'Yolande'},{'Yvonne':'VonnieVonna'},{'Yvette':'VettieVetta'},{'Zoe':'Zoey'}]

window.onload = function(){
  initGame();
  setInterval(game,1000/framerate);
};

canvas.onkeyup = function(e){
  e = e || event;
  key[e.keyCode] = e.type === 'keydown';
};

canvas.onkeydown = function(e){
  e = e || event;
  key[e.keyCode] = e.type === 'keydown';
};

canvas.addEventListener('mousemove', function(evt) {
  var mousePos = getMousePos(canvas, evt);

  mousex = mousePos.x;
  mousey = mousePos.y;
}, false);


function randName(gender){
	if (gender == "m") return Object.keys(mNamesNP[getRandomInt(mNamesNP.length)]);
	return Object.keys(fNamesNP[getRandomInt(fNamesNP.length)])
}

function generateName(gender) {
  let name = "";
  let vowels = ['a','e','i','o','u'];
  nameLength = getRandomInt(11) + 3;
  if (nameLength > 7){return randName(gender)}

  for (let i = 0; i < nameLength; i ++){
    let letter;

    if (i === 0){
      letter = (String.fromCharCode(getRandomInt(25) + 65));
    } else if (i % 3 === 1){
      letter = vowels[getRandomInt(5)];
    } else {
      letter = (String.fromCharCode(getRandomInt(25) + 65)).toLowerCase();
    }

    if (name[i-1] === "q" || name[i-1] === "Q") letter = 'u';

    while ((name[i-1] === "i" && letter === "i") || (name[i-1] === "I" && letter === "i")){
      letter = (String.fromCharCode(getRandomInt(25) + 65)).toLowerCase();
    }

    while (i === nameLength-1 && ["i","u","v","j"].includes(letter)){
      letter = (String.fromCharCode(getRandomInt(25) + 65)).toLowerCase();
    }
    name += letter;
  }

  return name;
}

function getRandomInt(max){
  return Math.floor(Math.random() * Math.floor(max));
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

function initGame(){
  let newIGO;
  let newNS;
  for (let i = 0; i < gameComplexity; i ++){
    newIGO =  {
      type:"Static",
      xpos:getRandomInt(mapbounds*2)-mapbounds,
      ypos:getRandomInt(mapbounds*2)-mapbounds,
      width:20,
      height:20,
      color:"#000000",
      fName:"box",
      lName:"",
	  words:"",
      hovered:0
    };
    drawArrayA.push(newIGO);
  }



  for (let i = 0; i < gameComplexity/2; i ++){
	let cgender = "M";
	if (getRandomInt(1) == 1) cgender = "F";
	
    newNS = {
      type:"AI",
      xpos:getRandomInt(mapbounds*2)-mapbounds,
      ypos:getRandomInt(mapbounds*2)-mapbounds,
      xvel:0,
      yvel:0,
      xdest:getRandomInt(mapbounds*2)-mapbounds,
      ydest:getRandomInt(mapbounds*2)-mapbounds,
      xwait:getRandomInt(50),
      ywait:getRandomInt(50),
      width:20,
      height:30,
	  gender:cgender,
      color:"#b20f5c",
      fName:generateName(),
      lName:generateName(),
      hovered:0

    };
    drawArrayA.push(newNS);
  }

}

function game(){
  move();
  draw(drawArrayA);
  mouse();

}
function mouseInbounds(obj){
  if (pointerx > obj.xpos && pointerx <  obj.xpos + obj.width){
    if (pointery > obj.ypos && pointery <  obj.ypos + obj.height){
      return true;
    }
  }
return false;
}

function mouse(){
  pointerx = mousex - camera.xPos;
  pointery = mousey - camera.yPos;

  for (let i = 0; i < drawArrayA.length;i++){
    if (mouseInbounds(drawArrayA[i])){
      drawArrayA[i].hovered = 2;
    }
  }
}

function move(){
  moveNonStatic();
  moveStatic();
  if (cameraMode !== "Free") movePlayer();
  moveCamera();
}

function moveNonStatic(){
  for (let i = 0; i < drawArrayA.length; i++){
    let NS = drawArrayA[i];

    if (NS.type === "AI"){
      if (NS.ywait < 0 && Math.abs(NS.ydest - NS.ypos) < 1) NS.ywait = getRandomInt(50); //create random wait time
      if (NS.ywait >= 0 && (Math.abs(NS.ydest - NS.ypos) < 1)){//if standing
        NS.ywait -= framerate/1000;//wait
        if (NS.ywait < 0) NS.ydest = getRandomInt(mapbounds*2)-mapbounds;//if wait time is up get new destination
      }

      if (NS.xwait < 0 && Math.abs(NS.xdest - NS.xpos) < 1) NS.xwait = getRandomInt(50); //create random wait time
      if (NS.xwait >= 0 && (Math.abs(NS.xdest - NS.xpos) < 1)){//if standing
        NS.xwait -= framerate/1000;//wait
        if (NS.xwait < 0) NS.xdest = getRandomInt(mapbounds*2)-mapbounds;//if wait time is up get new destination
      }

      if (Math.abs(NS.ydest - NS.ypos) > 1) NS.yvel = ((NS.ydest - NS.ypos) / Math.abs(NS.ydest - NS.ypos));
      if (Math.abs(NS.xdest - NS.xpos) > 1) NS.xvel = ((NS.xdest - NS.xpos) / Math.abs(NS.xdest - NS.xpos));

      if (Math.abs(NS.ydest - NS.ypos) < 1) NS.ypos = NS.ydest;
      if (Math.abs(NS.xdest - NS.xpos) < 1) NS.xpos = NS.xdest;

		for (let x = 0; x < drawArrayA.length; x++){
			let NSc = drawArrayA[x];
			if (NSc.type === "AI" && i != x){
				let xdiff = Math.abs(NS.xpos - NSc.xpos);
				let ydiff = Math.abs(NS.ypos - NSc.ypos);
				if (Math.sqrt((xdiff*xdiff) + (ydiff*ydiff)) < 50){
					NS.hovered = 2;
					NS.words = "hello";
		  }
		}
	  }
    }
  }
}


function moveStatic(){

  for (let i = 0; i < drawArrayA.length; i++){
    let thing = drawArrayA[i];
	let friction = 1.1;
    if (thing.friction !== undefined) friction = thing.friction;
    if (thing.xvel !== undefined) thing.xpos += thing.xvel;
    if (thing.yvel !== undefined) thing.ypos += thing.yvel;
	
	if (thing.life !== undefined){
		thing.life --;
		if (thing.life < 0) {
			drawArrayA.splice(i,1);
		}
		if (drawArrayA.length < 0) break;
	}

    if (Math.abs(thing.xvel) > 0.1){
      thing.xvel = thing.xvel/friction;
    }else if(thing.xvel !== 0){
      thing.xvel = 0;
    }

    if (Math.abs(thing.yvel) > 0.1){
      thing.yvel = thing.yvel/friction;
    }else if(thing.yvel !== 0){
      thing.yvel = 0;
    }


    if (thing.hovered > 0) thing.hovered -= framerate/1000;
  }
}

function pointInObject(point,object) {
	let xMin = object.xpos;
	let xMax = object.xpos + object.width;
	let yMin = object.ypos;
	let yMax = object.ypos + object.height;
	//console.log(point);
	//console.log(xMin + " > " + point[0] + " < " + xMax);
	if (point[0] > xMin && point[0] < xMax){
		console.log("within x");
		if (point[1] > yMin && point[1] < yMax){
					console.log("within y");
			return true;
		}
	}
	return false;
}

/*function checkCollisionX(x,y,vel) {
	let predict = x + vel;
	if (predict < -mapbounds)return -mapbounds;
	if (predict > mapbounds)return mapbounds;
	for (i = 0; i < drawArrayA.length; i++){
		let object = drawArrayA[i];
		if (pointInObject(predict,			y,object))return x;
		if (pointInObject(predict + 20,		y,object))return x;
		if (pointInObject(predict,			y + 30,object))return x;
		if (pointInObject(predict + 20,		y + 30,object))return x;
		
		if (pointInPlayer(object.xpos,					object.ypos))return x;
		if (pointInPlayer(object.xpos + object.width,	object.ypos))return x;
		if (pointInPlayer(object.xpos,					object.ypos + object.height))return x;
		if (pointInPlayer(object.xpos + object.width,	object.ypos + object.height))return x;
	}
	return x + vel;
}*/
/*
function checkCollisionY(x,y,vel) {
	let predict = y + vel;
	if (predict < -mapbounds)return -mapbounds;
	if (predict > mapbounds)return mapbounds;
		for (i = 0; i < drawArrayA.length; i++){
		let object = drawArrayA[i];
		if (pointInObject(x,		predict,object))return y;
		if (pointInObject(x + 20,		predict,object))return y;
		if (pointInObject(x,		predict + 30,object))return y;
		if (pointInObject(x + 20,		predict + 30,object))return y;
	}
	return y + vel;
}
*/

function checkPlayerCollisionX() {
	
	let Bounds = [
		[player.xPos,					player.yPos],
		[player.xPos + player.width,	player.yPos],
		[player.xPos,					player.yPos+player.height],
		[player.xPos + player.width,	player.yPos+player.height]
	];
	
	for (i = 0; i < drawArrayA.length; i++){
		let object = drawArrayA[i];
		for (boundi = 0; boundi < Bounds.length; boundi ++){
			let bound = Bounds[boundi];
			bound[0] += player.xVel;
			if (pointInObject(bound,object)) return player.xPos;
		}
	}
	
	return player.xPos+player.xVel;
	}
	
function checkCollisionY(x,y,vel) {return y+vel} 

function movePlayer(){
	
	let toBeX = checkPlayerCollisionX();
	if (toBeX == player.xPos) player.xVel = 0;
	
	player.xPos += player.xVel;
	
	
	
	player.yPos = checkCollisionY(player.xPos, player.yPos, player.yVel);
	player.shoottimer -= 0.1;

  if (Math.abs(player.xVel) > 0.1){
    player.xVel = player.xVel/1.1;
  }else if(player.xVel !== 0){
    player.xVel = 0;
  }

  if (Math.abs(player.yVel) > 0.1){
    player.yVel = player.yVel/1.1;
  }else if(player.yVel !== 0){
    player.yVel = 0;
  }

  if(key[87])player.yVel -=0.5;//W
  if(key[65])player.xVel -=0.5;//A
  if(key[83])player.yVel +=0.5;//S
  if(key[68])player.xVel +=0.5;//D
  
  if(key[37])shoot(-1,0);//left
  if(key[38])shoot(0,-1);//up
  if(key[39])shoot(1,0);//right
  if(key[40])shoot(0,1);//down
}


function moveCamera(){

  if (cameraMode === "Free") {
    camera.xPos += camera.xVel;
    camera.yPos += camera.yVel;

    if (Math.abs(camera.xVel) > 0.1) {
      camera.xVel = camera.xVel / 1.1;
    } else if (camera.xVel !== 0) {
      camera.xVel = 0;
    }

    if (Math.abs(camera.yVel) > 0.1) {
      camera.yVel = camera.yVel / 1.1;
    } else if (camera.yVel !== 0) {
      camera.yVel = 0;
    }

    if (key[87]) camera.yVel += 1;//W
    if (key[65]) camera.xVel += 1;//A
    if (key[83]) camera.yVel -= 1;//S
    if (key[68]) camera.xVel -= 1;//D

  } else if(cameraMode === "Player"){
    camera.xPos = -player.xPos + xDiff;
    camera.yPos = -player.yPos + yDiff;
  }

}

function shoot(shoot_xvel, shoot_yvel){
	if (player.shoottimer > 0) return;
	
	let xdiff = pointerx - player.xPos;
	let ydiff = pointery - player.yPos;
	let angle = Math.atan(xdiff / ydiff)*(180/3.141592653);
	let bvel = 5;
	
	let bullet = {
		xvel:shoot_xvel * bvel,
		yvel:shoot_yvel * bvel,
		xpos:player.xPos + 10,
		ypos:player.yPos + 10,
		width:3,
		height:3,
		color:"#000000",
		fName:"bullet",
		friction:1,
		life:100
	};
	
	drawArrayA.push(bullet);
	player.shoottimer = 2;
}


function draw(drawArray){
  board.clearRect(0, 0, canvas.width, canvas.height);//clears board for a new frame
  board.fillStyle = "#9CCC65";
  board.fillRect(0,0,canvas.width,canvas.height);
  
  for(let i = 1; i < drawArray.length; i++){
    let object = drawArray[i];
    board.fillStyle = object.color;
    board.fillRect(object.xpos + camera.xPos,object.ypos + camera.yPos,object.width,object.height);

    if (object.hasOwnProperty('hovered')){if (object.hovered > 0) {
      board.font = "16px Arial";
      board.fillStyle = "#2A2A2F";
      board.textAlign = "center";
      board.fillText(object.words, object.xpos + camera.xPos + (object.width/2), object.ypos + camera.yPos - 10);
    }}
  }
  
  let xdiff = pointerx - player.xPos;
  let ydiff = pointery - player.yPos;
  
  board.font = "18px Arial";
  board.textAlign = "left";
  board.fillText("player: x = " +player.xPos+ " , y = " +player.yPos,50,25);
  board.fillStyle = "#212121";
  board.fillRect(player.xPos + camera.xPos,player.yPos + camera.yPos,20,30);
}
