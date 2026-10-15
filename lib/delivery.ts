import {norm,type DishKey} from './catalog';
import type {SuggestRequest,Suggestion} from './types';

// Ideias de pedido usadas quando a IA não responde. Tipos de prato, nunca restaurantes reais nem preços.
const DELIVERY:Record<string,[string,DishKey,string,string[]][]>={
 caseira:[['Prato feito com proteína grelhada','arroz_feijao','Arroz, feijão, uma proteína grelhada e salada.',['A proteína é grelhada ou frita?','Dá para trocar a fritura por salada ou legumes?']],['Frango assado com acompanhamentos','frango','Frango assado com legumes e arroz.',['O tempero leva algum ingrediente que eu precise evitar?']]],
 japones:[['Combinado com sashimi e temaki','japones','Mais peças de peixe e menos fritas; arroz na medida da fome.',['O shoyu tem versão sem glúten?','Quais peças levam cream cheese ou empanados?']],['Yakisoba de frango com legumes','frango_arroz','Peça com mais legumes e molho à parte.',['O molho leva trigo?']]],
 hamburguer:[['Hambúrguer com salada e acompanhamento assado','hamburguer','Um hambúrguer simples, salada e batata assada no lugar da frita quando houver.',['Tem pão sem glúten ou opção no prato?','O molho especial leva leite ou ovo?']]],
 marmita:[['Marmita de frango com legumes','marmita','Proteína, carboidrato e legumes bem divididos.',['Quais ingredientes vão no tempero?','Tem opção sem lactose?']],['Marmita caseira de carne com arroz e feijão','caseira','Comida de casa para quem quer sustância.',['Dá para pedir mais salada?']]],
 saladas:[['Bowl com grão, proteína e folhas','bowl','Escolha uma proteína, um grão e muitos vegetais; molho à parte.',['O molho tem lactose ou glúten?','Os croutons podem sair?']],['Salada completa com frango','salada','Folhas, frango grelhado e grãos para dar saciedade.',['Posso adicionar ovo ou grão-de-bico?']]],
};
export function fallbackDelivery(req:SuggestRequest):Suggestion[]{
 const ex=new Set(req.exclude.map(norm));
 const pool=req.craving&&req.craving!=='tanto_faz'?DELIVERY[req.craving]:Object.values(DELIVERY).flat();
 return pool.filter(([t])=>!ex.has(norm(t))).slice(0,req.count).map(([title,image,description,ask],i)=>({id:`d-${i}-${Date.now().toString(36)}`,source:'delivery',title,image,description,minutes:0,difficulty:'facil',mode:'delivery',forWho:req.forWho,ingredients:[],steps:['Monte o pedido com uma fonte de proteína, um acompanhamento e legumes ou salada.','Peça molhos à parte para controlar o sabor e o que vai no prato.','Confira no app de delivery os ingredientes e o preço atual antes de fechar.'],substitutions:[],portions:{pessoa1:'',pessoa2:''},adaptations:{pessoa1:'',pessoa2:''},highlights:['Sugestão de pedido'],nutrition:'',cautions:['Sugestão de tipo de prato, não de restaurante real. Confirme ingredientes com o estabelecimento.'],askRestaurant:ask}));
}
