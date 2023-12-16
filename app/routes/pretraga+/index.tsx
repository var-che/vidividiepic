import { Data, ItemsResponse, fetchItems } from '#app/utils/api.server.ts'
import { queryAll } from '#app/utils/surrealdb.server.ts'
import { LoaderFunction } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'

export const loader: LoaderFunction = async remixContext => {
	const url = new URL(remixContext.request.url)
	const page = url.searchParams.get('page') || 0

  let r = await queryAll({sql: ['select * from article;']})
  console.log({r})
	const items = await fetchItems({
		page: Number(page),
	})

	return items
}

export default function Index() {
	const initialItems = useLoaderData<ItemsResponse>()
	const fetcher = useFetcher<ItemsResponse>()

	const [items, setItems] = useState<Data[]>(initialItems.data)

	// An effect for appending data to items state
	useEffect(() => {
		if (!fetcher.data || fetcher.state === 'loading') {
			return
		}

		if (fetcher.data) {
			const newItems = fetcher.data.data
			setItems(prevAssets => [...prevAssets, ...newItems])
		}
	}, [fetcher.data])

	return (
		<InfiniteScroller
			loadNext={() => {
				const page = fetcher.data
					? fetcher.data.page + 1
					: initialItems.page + 1
				const query = `?index&page=${page}`

				fetcher.load(query)
			}}
			loading={fetcher.state === 'loading'}
		>
			<div>
				{/* Items Grid */}
				<div className="items-container">
					{items.map(item => (
						<img key={item.id} className="item" src={item.thumb} />
					))}
				</div>

				{/* Loader */}
			</div>
		</InfiniteScroller>
	)
}

const InfiniteScroller = (props: {
	children: any
	loading: boolean
	loadNext: () => void
}) => {
	const { children, loading, loadNext } = props
	const scrollListener = useRef(loadNext)

	useEffect(() => {
		scrollListener.current = loadNext
	}, [loadNext])

	const onScroll = () => {
		const documentHeight = document.documentElement.scrollHeight
		const scrollDifference = Math.floor(window.innerHeight + window.scrollY)
		const scrollEnded = documentHeight == scrollDifference

		if (scrollEnded && !loading) {
			scrollListener.current()
		}
	}

	useEffect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('scroll', onScroll)
		}

		return () => {
			window.removeEventListener('scroll', onScroll)
		}
	}, [])

	return <>{children}</>
}
