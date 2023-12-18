import { queryAll } from "./surrealdb.server.ts";

export type Data = { id: number; thumb: string };
export type ItemsResponse = { data: Data[]; page: number };

export const fetchItems = async (query: {
  page: number;
}): Promise<ItemsResponse> => {
  const start = query.page * 30;

  const items = Array.from({ length: 30 }, (_, i) => i + start).map((id) => ({
    id,
    thumb: `https://picsum.photos/200?${id}`, // Mocked placeholder images
  }));

  // Fake delayed response
  await new Promise((r) => setTimeout(r, 500));


  return Promise.resolve({
    data: items,
    page: query.page,
  });
};

export const fetchArticlesAndStores = async (query: {
  page: number;
  place: string;
  item_desc: string;
}) => {
  
  let result = await queryAll({
    sql: [`SELECT 
  id,
  article_name,
  search::score(1) as score,
  <-includes<-(category AS subcategory)<-includes<-category AS category,
  (select
	  *, 
	  (select
		  (select
			  *
		  from <-store.*
		  where store_city=$place)[0] as city
	  FROM $parent)[0] as store 
	  from sells 
	  where out=type::thing($parent.id)) as sells


OMIT score
FROM article 
WITH INDEX ft_article_description
WHERE description @1@ $description
ORDER BY score DESC
LIMIT 10 
START ($page - 1) * 10

;`], parameters: {
      place: query.place,
      description: query.item_desc,
      page: query.page,
    },
  })

  await new Promise((r) => setTimeout(r, 500));

  return Promise.resolve({
    data: result,
    page: query.page,
  });
}

export const fetchDemoArticles =async (query: {
  page: number
}) => {
  let result = await queryAll({sql: [`select * from article LIMIT 10 
  START ($page - 1) * 10;`], parameters: {page: query.page}})

  // Fake delayed response
  await new Promise((r) => setTimeout(r, 500));


  return Promise.resolve({
    data: result.response,
    success: result.success,
    page: query.page,
  });
}